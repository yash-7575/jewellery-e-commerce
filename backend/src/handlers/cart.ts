import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  BatchGetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error, noContent } from "../lib/response";
import { methodOf, requestPath, pathParams, parseBody } from "../lib/http";
import { getUserId } from "../lib/auth";
import { requireString, requireNumber, ValidationError } from "../lib/validate";

const MAX_QTY = 10;

async function productById(id: string) {
  const out = await doc.send(
    new ScanCommand({
      TableName: TABLES.products,
      FilterExpression: "id = :id AND sk = :sk",
      ExpressionAttributeValues: { ":id": id, ":sk": "PRODUCT" },
      Limit: 1,
    })
  );
  return out.Items?.[0] || null;
}

function cartItemShape(it: any, p: any) {
  const unitPrice = p?.price ?? it.unitPrice ?? 0;
  const qty = it.qty ?? 1;
  const hero = p?.images?.[0]?.url || it.imageUrl || null;
  return {
    productId: it.productId,
    slug: p?.slug || it.slug,
    name: p?.name || it.name,
    unitPrice,
    qty,
    lineTotal: unitPrice * qty,
    imageUrl: hero,
    metal: p?.metal || it.metal,
    gemstone: p?.gemstone || it.gemstone,
    inStock: p ? (p.stock ?? 0) >= qty : true,
  };
}

async function fullCart(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const out = await doc.send(
    new QueryCommand({ TableName: TABLES.carts, KeyConditionExpression: "userId = :u", ExpressionAttributeValues: { ":u": userId } })
  );
  const items = out.Items || [];
  const ids = items.map((i) => i.productId);
  const products: Record<string, any> = {};
  if (ids.length) {
    const bg = await doc.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLES.products]: { Keys: ids.map((id) => ({ id, sk: "PRODUCT" })) },
        },
      })
    );
    for (const p of bg.Responses?.[TABLES.products] || []) products[p.id] = p;
  }
  const lines = items
    .map((it) => {
      const p = products[it.productId];
      return p && p.isActive === false ? null : cartItemShape(it, p);
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return json(200, {
    items: lines,
    count: lines.length,
    totals: { subtotal, shipping: 0, taxIncluded: true, grandTotal: subtotal },
  });
}

async function addItem(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const b = parseBody(event);
  let productId: string, qty: number;
  try {
    productId = requireString(b.productId, "productId");
    qty = requireNumber(b.qty, "qty");
    if (qty < 1) throw new ValidationError("qty must be at least 1", "qty");
  } catch (e) {
    if (e instanceof ValidationError) return error(400, "VALIDATION_ERROR", e.message, e.field);
    throw e;
  }

  const existing = await doc.send(
    new QueryCommand({
      TableName: TABLES.carts,
      KeyConditionExpression: "userId = :u AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":u": userId, ":prefix": `ITEM#${productId}` },
      Limit: 1,
    })
  );
  const curQty = existing.Items?.[0]?.qty || 0;
  const newQty = curQty + qty;
  if (newQty > MAX_QTY)
    return error(409, "MAX_QTY_PER_LINE", `Maximum ${MAX_QTY} units of a product per cart line.`, "qty");

  const p = await productById(productId);
  if (!p) return error(404, "PRODUCT_NOT_FOUND", `No product exists for id '${productId}'.`);
  if (p.isActive === false) return error(404, "PRODUCT_NOT_FOUND", `Product '${productId}' is not active.`);
  if ((p.stock ?? 0) < newQty)
    return error(409, "OUT_OF_STOCK", `Only ${p.stock ?? 0} units of this product are available.`, "qty");

  const now = new Date().toISOString();
  await doc.send(
    new PutCommand({
      TableName: TABLES.carts,
      Item: {
        userId,
        sk: `ITEM#${productId}`,
        productId,
        slug: p.slug,
        name: p.name,
        unitPrice: p.price,
        qty: newQty,
        meta: { lineTotal: p.price * newQty },
        imageUrl: p.images?.[0]?.url || null,
        metal: p.metal,
        gemstone: p.gemstone,
        addedAt: now,
        ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    })
  );
  return await fullCart(event);
}

async function updateQty(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const { productId } = pathParams(event);
  if (!productId) return error(400, "VALIDATION_ERROR", "productId is required.", "productId");
  const b = parseBody(event);
  let qty: number;
  try {
    qty = requireNumber(b.qty, "qty");
    if (qty < 0) throw new ValidationError("qty must be >= 0", "qty");
  } catch (e) {
    if (e instanceof ValidationError) return error(400, "VALIDATION_ERROR", e.message, e.field);
    throw e;
  }

  if (qty === 0) {
    const del = await doc.send(
      new DeleteCommand({ TableName: TABLES.carts, Key: { userId, sk: `ITEM#${productId}` } })
    );
    if (!del.$metadata?.httpStatusCode) return error(404, "CART_ITEM_NOT_FOUND", "Cart item not found.");
    return await fullCart(event);
  }

  if (qty > MAX_QTY) return error(409, "MAX_QTY_PER_LINE", `Maximum ${MAX_QTY} units per line.`, "qty");
  const p = await productById(productId);
  if (!p) return error(404, "CART_ITEM_NOT_FOUND", `No cart item for product '${productId}'.`);
  if ((p.stock ?? 0) < qty)
    return error(409, "OUT_OF_STOCK", `Only ${p.stock ?? 0} units of this product are available.`, "qty");

  await doc.send(
    new UpdateCommand({
      TableName: TABLES.carts,
      Key: { userId, sk: `ITEM#${productId}` },
      UpdateExpression: "SET qty = :q, meta.lineTotal = :lt",
      ExpressionAttributeValues: { ":q": qty, ":lt": p.price * qty },
    })
  );
  return await fullCart(event);
}

async function removeItem(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const { productId } = pathParams(event);
  if (!productId) return error(400, "VALIDATION_ERROR", "productId is required.", "productId");
  await doc.send(new DeleteCommand({ TableName: TABLES.carts, Key: { userId, sk: `ITEM#${productId}` } }));
  return noContent();
}

async function clearCart(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const out = await doc.send(
    new QueryCommand({ TableName: TABLES.carts, KeyConditionExpression: "userId = :u", ExpressionAttributeValues: { ":u": userId } })
  );
  for (const it of out.Items || []) {
    await doc.send(new DeleteCommand({ TableName: TABLES.carts, Key: { userId, sk: it.sk } }));
  }
  return noContent();
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (base === "/v1/cart" && method === "GET") return await fullCart(event);
    if (base === "/v1/cart" && method === "DELETE") return await clearCart(event);
    if (base === "/v1/cart/items" && method === "POST") return await addItem(event);

    const m = base.match(/^\/v1\/cart\/items\/([^/]+)$/);
    if (m) {
      if (method === "PATCH") return await updateQty({ ...event, pathParameters: { productId: m[1] } });
      if (method === "DELETE") return await removeItem({ ...event, pathParameters: { productId: m[1] } });
    }

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("cart handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};