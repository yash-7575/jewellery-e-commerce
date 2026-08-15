import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error, noContent } from "../lib/response";
import { methodOf, requestPath, pathParams, parseBody } from "../lib/http";
import { getUserId } from "../lib/auth";
import { requireString, ValidationError } from "../lib/validate";

async function productById(id: string) {
  const out = await doc.send(new GetCommand({ TableName: TABLES.products, Key: { id, sk: "PRODUCT" } }));
  return out.Item || null;
}

function wishShape(it: any, p: any) {
  return {
    productId: it.productId,
    slug: p?.slug || it.slug,
    name: p?.name || it.name,
    price: p?.price ?? it.unitPrice ?? 0,
    currency: "INR",
    imageUrl: p?.images?.[0]?.url || it.imageUrl || null,
    addedAt: it.addedAt,
    inStock: p ? (p.stock ?? 0) > 0 : true,
  };
}

async function list(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const out = await doc.send(
    new QueryCommand({ TableName: TABLES.wishlists, KeyConditionExpression: "userId = :u", ExpressionAttributeValues: { ":u": userId } })
  );
  const items = (out.Items || []).sort((a, b) => (b.addedAt || "").localeCompare(a.addedAt || ""));
  return json(200, { items: items.map((it) => wishShape(it, null)), count: items.length });
}

async function addItem(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const b = parseBody(event);
  let productId: string;
  try {
    productId = requireString(b.productId, "productId");
  } catch (e) {
    if (e instanceof ValidationError) return error(400, "VALIDATION_ERROR", e.message, e.field);
    throw e;
  }
  const p = await productById(productId);
  if (!p) return error(404, "PRODUCT_NOT_FOUND", `No product exists for id '${productId}'.`);
  if (p.isActive === false) return error(404, "PRODUCT_NOT_FOUND", `Product '${productId}' is not active.`);

  const now = new Date().toISOString();
  await doc.send(
    new PutCommand({
      TableName: TABLES.wishlists,
      Item: {
        userId,
        sk: `ITEM#${p.id}`,
        productId: p.id,
        slug: p.slug,
        name: p.name,
        unitPrice: p.price,
        imageUrl: p.images?.[0]?.url || null,
        addedAt: now,
      },
    })
  );
  return json(201, { productId: p.id, slug: p.slug, addedAt: now });
}

function removeItemFromWishlist(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const { productId } = pathParams(event);
  if (!productId) return error(400, "VALIDATION_ERROR", "productId is required.", "productId");
  return doc.send(new DeleteCommand({ TableName: TABLES.wishlists, Key: { userId, sk: `ITEM#${productId}` } })
  ).then(() => noContent());
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (base === "/v1/wishlist" && method === "GET") return await list(event);
    if (base === "/v1/wishlist/items" && method === "POST") return await addItem(event);

    const m = base.match(/^\/v1\/wishlist\/items\/([^/]+)$/);
    if (m && method === "DELETE")
      return await removeItemFromWishlist({ ...event, pathParameters: { productId: m[1] } });

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("wishlist handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};