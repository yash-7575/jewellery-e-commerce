import { QueryCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import { doc, TABLES } from "../lib/dynamo";
import { json, error } from "../lib/response";
import { methodOf, requestPath, parseBody } from "../lib/http";
import { getUserId } from "../lib/auth";
import { getRazorpayClient, getKeys } from "../lib/razorpay";

function nowPlusMinutes(mins: number) {
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

async function loadOrderForUser(event: any, orderId: string) {
  const userId = getUserId(event);
  if (!userId) return { order: null, userId };
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.orders,
      KeyConditionExpression: "orderId = :o",
      ExpressionAttributeValues: { ":o": orderId },
    })
  );
  const root = (out.Items || []).find((r) => r.sk === "ORDER");
  if (!root || root.userId !== userId) return { order: null, userId };
  return { order: root, userId };
}

async function createOrder(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const b = parseBody(event);
  const orderId = b.orderId;
  if (typeof orderId !== "string" || !orderId) {
    return error(400, "VALIDATION_ERROR", "orderId is required.", "orderId");
  }

  const { order } = await loadOrderForUser(event, orderId);
  if (!order) return error(404, "ORDER_NOT_FOUND", `No order exists for id '${orderId}'.`);

  if (order.status === "PAID") return error(409, "ALREADY_PAID", "This order has already been paid.");
  if (order.status !== "PENDING_PAYMENT")
    return error(409, "ORDER_NOT_PAYABLE", `Order is in status '${order.status}' and cannot be paid.`);

  const createdAt = new Date(order.createdAt || Date.now()).getTime();
  if (Date.now() - createdAt > 15 * 60 * 1000) {
    await doc.send(
      new UpdateCommand({
        TableName: TABLES.orders,
        Key: { orderId, sk: "ORDER" },
        UpdateExpression: "SET #s = :c, updatedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":c": "CANCELLED",
          ":t": new Date().toISOString(),
          ":t0": order.timeline || [],
        },
      })
    );
    return error(409, "ORDER_EXPIRED", "Order payment window (15 min) has expired. Please re-checkout.");
  }

  const totalInr = order.amounts?.total ?? 0;
  const amountPaise = Math.round(totalInr * 100);
  const rzp = await getRazorpayClient();
  let rzpOrder: any;
  try {
    rzpOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: orderId,
      notes: { userId },
    });
  } catch (e: any) {
    console.error("razorpay order create failed", e);
    return error(500, "RAZORPAY_ERROR", "Could not create Razorpay order.");
  }

  const timeline = Array.isArray(order.timeline) ? order.timeline : [];
  await doc.send(
    new UpdateCommand({
      TableName: TABLES.orders,
      Key: { orderId, sk: "ORDER" },
      UpdateExpression: "SET payment.razorpayOrderId = :ro, payment.paymentStatus = :ps, updatedAt = :t",
      ExpressionAttributeValues: {
        ":ro": rzpOrder.id,
        ":ps": "AUTHORIZED",
        ":t": new Date().toISOString(),
        ":tl": timeline,
      },
    })
  );

  const keys = await getKeys();
  return json(200, {
    razorpayOrderId: rzpOrder.id,
    amountPaise,
    amount: totalInr,
    currency: "INR",
    keyId: keys.key_id,
    receipt: orderId,
    notes: { userId },
    expiresAt: nowPlusMinutes(15),
  });
}

async function verifyPayment(event: any) {
  const b = parseBody(event);
  const orderId = b.razorpay_order_id || b.orderId;
  const paymentId = b.razorpay_payment_id;
  const signature = b.razorpay_signature;

  if (typeof orderId !== "string") return error(400, "VALIDATION_ERROR", "razorpay_order_id is required.", "razorpay_order_id");
  if (typeof paymentId !== "string") return error(400, "VALIDATION_ERROR", "razorpay_payment_id is required.", "razorpay_payment_id");
  if (typeof signature !== "string") return error(400, "VALIDATION_ERROR", "razorpay_signature is required.", "razorpay_signature");

  const { order, userId } = await loadOrderForUser(event, orderId);
  if (!order) return error(404, "RAZORPAY_ORDER_NOT_FOUND", `No order exists for id '${orderId}'.`);
  if (order.status === "PAID") return error(409, "ALREADY_PAID", "This order has already been paid.");

  const keys = await getKeys();
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", keys.key_secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b2 = Buffer.from(signature, "utf8");
  const ok = a.length === b2.length && crypto.timingSafeEqual(a, b2);
  if (!ok) return error(400, "INVALID_SIGNATURE", "Payment signature verification failed.");

  const timeline = Array.isArray(order.timeline) ? order.timeline : [];
  await doc.send(
    new UpdateCommand({
      TableName: TABLES.orders,
      Key: { orderId, sk: "ORDER" },
      UpdateExpression:
        "SET #s = :paid, payment.razorpayPaymentId = :pid, payment.paymentStatus = :cap, payment.capturedAmount = :amt, updatedAt = :t",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":paid": "PAID",
        ":pid": paymentId,
        ":cap": "CAPTURED",
        ":amt": Math.round((order.amounts?.total ?? 0) * 100),
        ":t": new Date().toISOString(),
        ":tl": timeline,
      },
    })
  );

  return json(200, {
    orderId,
    status: "PAID",
    paymentStatus: "CAPTURED",
  });
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (base === "/v1/payments/create-order" && method === "POST") return await createOrder(event);
    if (base === "/v1/payments/verify" && method === "POST") return await verifyPayment(event);

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("payments handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};