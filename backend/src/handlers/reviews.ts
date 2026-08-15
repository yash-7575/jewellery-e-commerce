import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error, noContent } from "../lib/response";
import { methodOf, requestPath, pathParams, queryParams, parseBody } from "../lib/http";
import { getUserId, getName, isAdmin } from "../lib/auth";
import { requireNumber, requireString } from "../lib/validate";

async function productBySlug(slug: string) {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.products,
      IndexName: "gsi_slug",
      KeyConditionExpression: "slug = :s",
      ExpressionAttributeValues: { ":s": slug },
      Limit: 1,
    })
  );
  return out.Items?.[0] || null;
}

function reviewShape(r: any) {
  return {
    reviewId: r.reviewId,
    userName: r.userName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    images: r.images || [],
    verifiedPurchase: !!r.verifiedPurchase,
    createdAt: r.createdAt,
  };
}

async function listReviews(event: any) {
  const q = queryParams(event);
  const { slug } = pathParams(event);
  if (!slug) return error(400, "VALIDATION_ERROR", "slug is required.", "slug");
  const limit = Math.min(parseInt(q.limit || "20", 10) || 20, 100);
  const sort = q.sort || "newest";

  const p = await productBySlug(slug);
  if (!p) return error(404, "PRODUCT_NOT_FOUND", `No product exists for slug '${slug}'.`);

  const out = await doc.send(
    new QueryCommand({ TableName: TABLES.reviews, KeyConditionExpression: "productId = :p", ExpressionAttributeValues: { ":p": p.id } })
  );
  let items = (out.Items || []).filter((r) => r.status === "APPROVED");
  if (sort === "highest") items.sort((a, b) => b.rating - a.rating);
  else if (sort === "lowest") items.sort((a, b) => a.rating - b.rating);
  else items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const page = items.slice(0, limit + 1);
  const hasMore = page.length > limit;
  if (hasMore) page.pop();
  const aggregate = {
    average: items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0,
    count: items.length,
  };
  return json(200, {
    items: page.map(reviewShape),
    count: page.length,
    aggregate,
    nextCursor: hasMore ? Buffer.from("more").toString("base64") : null,
  });
}

async function createReview(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const { slug } = pathParams(event);
  if (!slug) return error(400, "VALIDATION_ERROR", "slug is required.", "slug");
  const b = parseBody(event);

  const rating = b.rating;
  if (typeof rating !== "number" || rating < 1 || rating > 5)
    return error(400, "VALIDATION_ERROR", "rating must be an integer between 1 and 5", "rating");

  const p = await productBySlug(slug);
  if (!p) return error(404, "PRODUCT_NOT_FOUND", `No product exists for slug '${slug}'.`);

  const dup = await doc.send(
    new QueryCommand({
      TableName: TABLES.reviews,
      IndexName: "gsi_user_created",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  const existing = (dup.Items || []).find((r) => r.productId === p.id);
  if (existing) return error(409, "REVIEW_EXISTS", "You have already reviewed this product.");

  const purchased = await hasPurchased(userId, p.id);
  const reviewId = "RVW-" + Math.random().toString(16).slice(2, 8);
  const now = new Date().toISOString();
  const name = getName(event) || "AARANYA Customer";
  const userName = name.split(" ")[0] + (name.split(" ")[1] ? ` ${name.split(" ")[1][0]}.` : "");

  await doc.send(
    new PutCommand({
      TableName: TABLES.reviews,
      Item: {
        productId: p.id,
        sk: `${now}#${reviewId}`,
        reviewId,
        userId,
        userName,
        rating,
        title: b.title ? String(b.title) : "",
        body: b.body ? String(b.body) : "",
        images: Array.isArray(b.images) ? b.images.map(String) : [],
        verifiedPurchase: purchased,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      },
    })
  );
  return json(201, { reviewId, status: "PENDING", createdAt: now });
}

async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.orders,
      IndexName: "gsi_user_created",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  const paid = (out.Items || []).filter((o) => o.sk === "ORDER" && o.status === "PAID");
  if (!paid.length) return false;
  for (const o of paid) {
    const order = await doc.send(
      new QueryCommand({ TableName: TABLES.orders, KeyConditionExpression: "orderId = :o", ExpressionAttributeValues: { ":o": o.orderId } })
    );
    if ((order.Items || []).some((r) => r.productId === productId && r.sk !== "ORDER")) return true;
  }
  return false;
}

async function deleteReview(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const { reviewId } = pathParams(event);
  if (!reviewId) return error(400, "VALIDATION_ERROR", "reviewId is required.", "reviewId");
  const admin = isAdmin(event);

  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.reviews,
      IndexName: "gsi_user_created",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  let target = (out.Items || []).find((r) => r.reviewId === reviewId);
  if (!target && admin) {
    const scan = await doc.send(
      new QueryCommand({
        TableName: TABLES.reviews,
        IndexName: "gsi_status",
        KeyConditionExpression: "status = :s",
        ExpressionAttributeValues: { ":s": "APPROVED" },
      })
    );
    target = (scan.Items || []).find((r) => r.reviewId === reviewId);
  }
  if (!target) return error(404, "REVIEW_NOT_FOUND", `No review exists for id '${reviewId}'.`);
  await doc.send(
    new DeleteCommand({ TableName: TABLES.reviews, Key: { productId: target.productId, sk: target.sk } })
  );
  return noContent();
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    const rm = base.match(/^\/v1\/products\/([^/]+)\/reviews$/);
    if (rm) {
      if (method === "GET") return await listReviews({ ...event, pathParameters: { slug: rm[1] } });
      if (method === "POST") return await createReview({ ...event, pathParameters: { slug: rm[1] } });
    }

    const dm = base.match(/^\/v1\/reviews\/([^/]+)$/);
    if (dm && method === "DELETE") return await deleteReview({ ...event, pathParameters: { reviewId: dm[1] } });

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("reviews handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};