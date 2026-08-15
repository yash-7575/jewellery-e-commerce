import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error } from "../lib/response";
import { methodOf, requestPath, queryParams } from "../lib/http";

function card(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category,
    metal: p.metal,
    gemstone: p.gemstone,
    weightG: p.weightG,
    size: p.size,
    price: p.price,
    currency: p.currency || "INR",
    images: p.images || [],
    rating: p.rating || { average: 0, count: 0 },
    isFeatured: !!p.isFeatured,
    inStock: p.stock != null ? p.stock > 0 : true,
    createdAt: p.createdAt,
  };
}

async function search(event: any) {
  const q = queryParams(event);
  const term = (q.q || "").trim();
  if (term.length < 2) return error(400, "VALIDATION_ERROR", "q must be at least 2 characters.", "q");
  const limit = Math.min(parseInt(q.limit || "24", 10) || 24, 100);
  const t = term.toLowerCase();

  const scan = await doc.send(
    new ScanCommand({
      TableName: TABLES.products,
      FilterExpression: "isActive <> :off",
      ExpressionAttributeValues: { ":off": false },
    })
  );
  const isMatch = (p: any) =>
    (typeof p.name === "string" && p.name.toLowerCase().includes(t)) ||
    (typeof p.subtitle === "string" && p.subtitle.toLowerCase().includes(t)) ||
    (Array.isArray(p.tags) && p.tags.some((x) => typeof x === "string" && x.toLowerCase().includes(t)));
  const all = (scan.Items || []).filter(isMatch);

  const items = all
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit + 1);
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  return json(200, {
    items: items.map(card),
    count: items.length,
    nextCursor: hasMore ? Buffer.from(JSON.stringify({ last: items[items.length - 1].id })).toString("base64") : null,
  });
}

async function suggest(event: any) {
  const q = queryParams(event);
  const term = (q.q || "").trim();
  if (term.length < 2) return error(400, "VALIDATION_ERROR", "q must be at least 2 characters.", "q");
  const limit = Math.min(parseInt(q.limit || "10", 10) || 10, 100);
  const t = term.toLowerCase();

  const scan = await doc.send(
    new ScanCommand({
      TableName: TABLES.products,
      FilterExpression: "isActive <> :off",
      ExpressionAttributeValues: { ":off": false },
    })
  );
  const products = (scan.Items || [])
    .filter((p) => typeof p.name === "string" && p.name.toLowerCase().startsWith(t))
    .slice(0, limit);
  const catScan = await doc.send(new ScanCommand({ TableName: TABLES.categories }));
  const cats = (catScan.Items || [])
    .filter((c) => c.sk === "META" && c.slug.toLowerCase().startsWith(t));

  const suggestions: any[] = [];
  for (const p of products) {
    suggestions.push({ type: "product", text: p.name, slug: p.slug, imageUrl: p.images?.[0]?.url || null });
    if (suggestions.length >= limit) break;
  }
  for (const c of cats) {
    suggestions.push({ type: "category", text: c.name, slug: c.slug });
    if (suggestions.length >= limit) break;
  }
  return json(200, { suggestions: suggestions.slice(0, limit) });
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (base === "/v1/search" && method === "GET") return await search(event);
    if (base === "/v1/search/suggest" && method === "GET") return await suggest(event);

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("search handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};