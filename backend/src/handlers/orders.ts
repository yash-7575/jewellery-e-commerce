import {
  QueryCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error } from "../lib/response";
import { methodOf, requestPath, pathParams, queryParams, parseBody } from "../lib/http";
import { getUserId, isAdmin } from "../lib/auth";
import { ValidationError } from "../lib/validate";

function orderId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `ORD-${ymd}-${s}`;
}

function orderRootShape(o: any) {
  return {
    orderId: o.orderId,
    status: o.status,
    amounts: o.amounts || { subtotal: 0, shipping: 0, discount: 0, tax: 0, total: 0 },
    currency: o.currency || "INR",
    itemCount: o.itemCount ?? 0,
    shippingAddress: o.shippingAddress || null,
    payment: o.payment || { method: "razorpay", paymentStatus: "PENDING" },
    items: o.items || undefined,
    timeline: o.timeline || [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function summaryShape(o: any) {
  const amounts = o.amounts || { total: o.total || 0 };
  return {
    orderId: o.orderId,
    status: o.status,
    currency: o.currency || "INR",
    total: amounts.total ?? o.total ?? 0,
    itemCount: o.itemCount ?? 0,
    createdAt: o.createdAt,
  };
}

async function productById(id: string) {
  const out = await doc.send(new GetCommand({ TableName: TABLES.products, Key: { id, sk: "PRODUCT" } }));
  return out.Item || null;
}

async function createOrder(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const b = parseBody(event);
  const addressId = b.addressId;

  const profile = await doc.send(new GetCommand({ TableName: TABLES.users, Key: { userId, sk: "PROFILE" } }));
  const addr = addressId
    ? await doc.send(new GetCommand({ TableName: TABLES.users, Key: { userId, sk: `ADDR-${addressId}` } }))
    : null;
  if (addressId && !addr.Item)
    return error(404, "ADDRESS_NOT_FOUND", `No address exists for id '${addressId}'.`);
  const shippingAddress = addr.Item
    ? {
        recipient: addr.Item.recipient,
        phone: addr.Item.phone,
        line1: addr.Item.line1,
        line2: addr.Item.line2 || "",
        city: addr.Item.city,
        state: addr.Item.state,
        pincode: addr.Item.pincode,
        country: addr.Item.country || "IN",
      }
    : null;

  const cart = await doc.send(
    new QueryCommand({ TableName: TABLES.carts, KeyConditionExpression: "userId = :u", ExpressionAttributeValues: { ":u": userId } })
  );
  const cartItems = cart.Items || [];
  if (!cartItems.length) return error(400, "CART_EMPTY", "Cart is empty. Add items before checkout.");

  const outOfStock: { productId: string; requested: number; available: number }[] = [];
  const lines = [];
  for (const it of cartItems) {
    const p = await productById(it.productId);
    if (!p) {
      outOfStock.push({ productId: it.productId, requested: it.qty || 1, available: 0 });
      continue;
    }
    if (p.isActive === false)
      return error(409, "PRODUCT_UNACTIVE", `Product '${it.productId}' is no longer available.`);
    const requested = it.qty || 1;
    const available = p.stock ?? 0;
    if (requested > available) outOfStock.push({ productId: it.productId, requested, available });
    lines.push({
      productId: it.productId,
      slug: p.slug,
      name: p.name,
      unitPrice: p.price,
      qty: requested,
      lineTotal: p.price * requested,
      metal: p.metal,
      gemstone: p.gemstone,
      weightG: p.weightG,
      size: p.size,
      imageUrl: p.images?.[0]?.url || null,
    });
  }
  if (outOfStock.length) {
    return json(409, {
      error: { code: "OUT_OF_STOCK", message: "Some items are out of stock.", field: null, items: outOfStock },
    });
  }

  const oid = orderId();
  const now = new Date().toISOString();
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const amounts = { subtotal, shipping: 0, discount: 0, tax: 0, total: subtotal };

  const transact = [];
  for (const l of lines) {
    transact.push({
      Update: {
        TableName: TABLES.products,
        Key: { id: l.productId, sk: "PRODUCT" },
        UpdateExpression: "SET stock = stock - :q",
        ConditionExpression: "stock >= :q",
        ExpressionAttributeValues: { ":q": l.qty },
      },
    });
  }
  transact.push({
    Put: {
      TableName: TABLES.orders,
      Item: {
        orderId: oid,
        sk: "ORDER",
        userId,
        status: "PENDING_PAYMENT",
        amounts,
        currency: "INR",
        itemCount: lines.length,
        shippingAddress,
        notes: b.notes || null,
        payment: { method: "razorpay", razorpayOrderId: null, razorpayPaymentId: null, paymentStatus: "PENDING", capturedAmount: null },
        timeline: [{ status: "CREATED", at: now }],
        createdAt: now,
        updatedAt: now,
        exp: Math.floor(Date.now() / 1000) + 15 * 60,
      },
    },
  });
  lines.forEach((l, i) => {
    transact.push({
      Put: {
        TableName: TABLES.orders,
        Item: { ...l, orderId: oid, sk: `ITEM#${i + 1}` },
      },
    });
  });
  for (const it of cartItems) {
    transact.push({ Delete: { TableName: TABLES.carts, Key: { userId, sk: it.sk } } });
  }

  try {
    await doc.send(new TransactWriteCommand({ TransactItems: transact }));
  } catch (e: any) {
    if (e?.name === "TransactionCanceledException") {
      const reasons = e.CancellationReasons || [];
      const stockIdx = reasons.findIndex((r: any) => r.Code === "ConditionalCheckFailed" && r.TableName?.includes?.("products") !== false);
      if (stockIdx >= 0 && lines[stockIdx]) {
        const p = await productById(lines[stockIdx].productId);
        return error(409, "OUT_OF_STOCK", "Some items are out of stock.", JSON.stringify([{
          productId: lines[stockIdx].productId,
          requested: lines[stockIdx].qty,
          available: p?.stock ?? 0,
        }]));
      }
      return error(409, "OUT_OF_STOCK", "Could not reserve stock for the order.");
    }
    throw e;
  }

  const items = lines.map((l, i) => ({ ...l, lineNumber: i + 1 }));
  return json(201, orderRootShape({
    orderId: oid,
    status: "PENDING_PAYMENT",
    amounts,
    currency: "INR",
    itemCount: lines.length,
    shippingAddress,
    payment: { method: "razorpay", paymentStatus: "PENDING" },
    items,
    timeline: [{ status: "CREATED", at: now }],
    createdAt: now,
    updatedAt: now,
  }) as any);
}

async function listOrders(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const q = queryParams(event);
  const status = q.status || null;
  const limit = Math.min(parseInt(q.limit || "20", 10) || 20, 100);

  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.orders,
      IndexName: "gsi_user_created",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
      ScanIndexForward: false,
    })
  );
  let items = (out.Items || []).filter((o) => o.sk === "ORDER");
  if (status) items = items.filter((o) => o.status === status);
  items = items.slice(0, limit + 1);
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  const nextCursor = hasMore
    ? Buffer.from(JSON.stringify({ last: items[items.length - 1].createdAt })).toString("base64")
    : null;
  return json(200, { items: items.map(summaryShape), count: items.length, nextCursor });
}

async function getOrder(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const { orderId } = pathParams(event);
  if (!orderId) return error(400, "VALIDATION_ERROR", "orderId is required.", "orderId");
  const admin = isAdmin(event);

  const out = await doc.send(
    new QueryCommand({ TableName: TABLES.orders, KeyConditionExpression: "orderId = :o", ExpressionAttributeValues: { ":o": orderId } })
  );
  const rows = out.Items || [];
  const root = rows.find((r) => r.sk === "ORDER");
  if (!root) return error(404, "ORDER_NOT_FOUND", `No order exists for id '${orderId}'.`);
  if (root.userId !== userId && !admin) return error(404, "ORDER_NOT_FOUND", `No order exists for id '${orderId}'.`);

  const items = rows
    .filter((r) => r.sk !== "ORDER")
    .sort((a, b) => a.sk.localeCompare(b.sk))
    .map((r) => ({
      productId: r.productId,
      slug: r.slug,
      name: r.name,
      unitPrice: r.unitPrice,
      qty: r.qty,
      lineTotal: r.lineTotal,
      imageUrl: r.imageUrl,
    }));

  return json(200, { ...orderRootShape(root), items });
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (base === "/v1/orders" && method === "POST") return await createOrder(event);
    if (base === "/v1/orders" && method === "GET") return await listOrders(event);

    const m = base.match(/^\/v1\/orders\/([^/]+)$/);
    if (m && method === "GET") return await getOrder({ ...event, pathParameters: { orderId: m[1] } });

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("orders handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};