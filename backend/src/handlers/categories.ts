import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error } from "../lib/response";
import { methodOf, requestPath } from "../lib/http";

function shape(c: any) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    parentId: c.parentId ?? null,
    imageUrl: c.imageUrl,
    displayOrder: c.displayOrder ?? 0,
  };
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const base = requestPath(event);

    if (base === "/v1/categories") {
      const out = await doc.send(new ScanCommand({ TableName: TABLES.categories }));
      const cats = (out.Items || [])
        .filter((c) => c.sk === "META" && c.isActive !== false)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      const items = cats.map((c) => ({ ...shape(c), productCount: c.productCount ?? 0 }));
      return json(200, { items, count: items.length });
    }

    const m = base.match(/^\/v1\/categories\/([^/]+)$/);
    if (m) {
      const out = await doc.send(
        new QueryCommand({
          TableName: TABLES.categories,
          IndexName: "gsi_slug",
          KeyConditionExpression: "slug = :s",
          ExpressionAttributeValues: { ":s": m[1] },
          Limit: 1,
        })
      );
      const c = out.Items?.[0];
      if (!c) return error(404, "CATEGORY_NOT_FOUND", `No category exists for slug '${m[1]}'.`);
      return json(200, shape(c));
    }

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("categories handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};