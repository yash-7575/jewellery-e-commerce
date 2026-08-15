import { ScanCommand, GetCommand, QueryCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { doc, TABLES } from "../lib/dynamo";
import { json, error, noContent } from "../lib/response";
import { methodOf, requestPath, pathParams, queryParams, parseBody } from "../lib/http";
import { getUserId, isAdmin } from "../lib/auth";
import { requireString, requireNumber, requireEnum, optionalString, optionalNumber, ValidationError } from "../lib/validate";

const METALS = ["22k-gold", "silver", "rose-gold", "platinum"];
const GEMSTONES = ["diamond", "ruby", "emerald", "polki", "none"];
const SORTS = ["price_asc", "price_desc", "newest", "popular"];
const S3 = () =>
  new (require("@aws-sdk/client-s3").S3Client)({ region: process.env.AWS_REGION || "ap-south-1" });

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

function detail(p: any) {
  return {
    ...card(p),
    categoryName: p.categoryName,
    description: p.description,
    stock: p.stock,
    tags: p.tags || [],
    updatedAt: p.updatedAt,
  };
}

function sortBy(items: any[], sort: string): any[] {
  switch (sort) {
    case "price_asc":
      return [...items].sort((a, b) => a.price - b.price);
    case "price_desc":
      return [...items].sort((a, b) => b.price - a.price);
    case "popular":
      return [...items].sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0));
    case "newest":
    default:
      return [...items].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
  }
}

function nextCursorFrom(items: any[], limit: number): string | null {
  if (items.length <= limit) return null;
  items.pop();
  return Buffer.from(JSON.stringify({ lastKey: items[items.length - 1]?.id })).toString("base64");
}

async function listProducts(event: any) {
  const q = queryParams(event);
  let sort = q.sort || "newest";
  let metal: string | null = q.metal || null;
  let gemstone: string | null = q.gemstone || null;
  let category: string | null = q.category || null;
  const minPrice = optionalNumber(q.minPrice);
  const maxPrice = optionalNumber(q.maxPrice);
  const limit = Math.min(parseInt(q.limit || "24", 10) || 24, 100);

  if (sort && !SORTS.includes(sort)) return error(400, "INVALID_FILTER_VALUE", `sort must be one of ${SORTS.join(", ")}`, "sort");
  if (metal && !METALS.includes(metal)) return error(400, "INVALID_FILTER_VALUE", `metal must be one of ${METALS.join(", ")}`, "metal");
  if (gemstone && !GEMSTONES.includes(gemstone)) return error(400, "INVALID_FILTER_VALUE", `gemstone must be one of ${GEMSTONES.join(", ")}`, "gemstone");
  if (minPrice != null && maxPrice != null && minPrice > maxPrice)
    return error(400, "INVALID_PRICE_RANGE", "minPrice cannot be greater than maxPrice");

  if (q.q && q.q.trim().length >= 2) {
    const { query } = parseBodyWrapper(event);
    void query;
    return searchProductsWithin(q.q, limit);
  }

  const out = await doc.send(new ScanCommand({ TableName: TABLES.products }));
  let items = (out.Items || []).filter((p) => p.isActive !== false && p.sk === "PRODUCT");

  if (category) items = items.filter((p) => p.category === category);
  if (metal) items = items.filter((p) => p.metal === metal);
  if (gemstone) items = items.filter((p) => p.gemstone === gemstone);
  if (minPrice != null) items = items.filter((p) => p.price >= minPrice);
  if (maxPrice != null) items = items.filter((p) => p.price <= maxPrice);

  items = sortBy(items, sort);
  const page = items.slice(0, limit + 1);
  const nextCursor = nextCursorFrom(page, limit);

  return json(200, { items: page.map(card), count: page.length, nextCursor });
}

function parseBodyWrapper(_event: any) {
  return { query: {} };
}

async function searchProductsWithin(term: string, limit: number) {
  const t = term.toLowerCase();
  const out = await doc.send(new ScanCommand({ TableName: TABLES.products }));
  let items = (out.Items || []).filter(
    (p) => p.isActive !== false && p.sk === "PRODUCT" &&
      (typeof p.name === "string" && p.name.toLowerCase().includes(t) ||
        (typeof p.subtitle === "string" && p.subtitle.toLowerCase().includes(t)) ||
        Array.isArray(p.tags) && p.tags.some((x) => typeof x === "string" && x.toLowerCase().includes(t)))
  );
  items = sortBy(items, "newest").slice(0, limit + 1);
  const nextCursor = nextCursorFrom(items, limit);
  return json(200, { items: items.map(card), count: items.length, nextCursor });
}

async function getBySlug(slug: string) {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.products,
      IndexName: "gsi_slug",
      KeyConditionExpression: "slug = :s",
      ExpressionAttributeValues: { ":s": slug },
      Limit: 1,
    })
  );
  const p = out.Items?.[0];
  if (!p) return error(404, "PRODUCT_NOT_FOUND", `No product exists for slug '${slug}'.`);
  if (p.isActive === false) return error(404, "PRODUCT_NOT_ACTIVE", `Product '${slug}' is not active.`);
  return json(200, detail(p));
}

async function getCategoryName(category: string): Promise<string | null> {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.categories,
      IndexName: "gsi_slug",
      KeyConditionExpression: "slug = :s",
      ExpressionAttributeValues: { ":s": category },
      Limit: 1,
    })
  );
  return out.Items?.[0]?.name || null;
}

function genId() {
  return "P-" + Math.floor(1000 + Math.random() * 9000);
}

async function createProduct(event: any) {
  if (!isAdmin(event)) return error(403, "FORBIDDEN", "Admin access required.");
  const b = parseBody(event);
  try {
    const slug = requireString(b.slug, "slug");
    const name = requireString(b.name, "name");
    const price = requireNumber(b.price, "price");
    if (price <= 0) throw new ValidationError("price must be greater than 0", "price");
    const category = requireString(b.category, "category");
    const catName = await getCategoryName(category);
    if (!catName) return error(400, "CATEGORY_NOT_FOUND", `Category '${category}' does not exist.`, "category");

    const existing = await doc.send(
      new QueryCommand({
        TableName: TABLES.products,
        IndexName: "gsi_slug",
        KeyConditionExpression: "slug = :s",
        ExpressionAttributeValues: { ":s": slug },
        Limit: 1,
      })
    );
    if (existing.Items?.length) return error(409, "SLUG_EXISTS", `A product with slug '${slug}' already exists.`, "slug");

    const id = genId();
    const now = new Date().toISOString();
    const item = {
      id,
      sk: "PRODUCT",
      slug,
      name,
      subtitle: optionalString(b.subtitle) || "",
      category,
      categoryId: b.categoryId || null,
      categoryName: catName,
      description: optionalString(b.description) || "",
      metal: optionalString(b.metal) || "22k-gold",
      gemstone: optionalString(b.gemstone) || "none",
      weightG: optionalNumber(b.weightG),
      size: optionalString(b.size) || "",
      price,
      currency: "INR",
      stock: Math.max(0, parseInt(String(b.stock ?? 0), 10) || 0),
      isActive: b.isActive !== false,
      isFeatured: !!b.isFeatured,
      images: Array.isArray(b.images) ? b.images : [],
      rating: { average: 0, count: 0 },
      tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
      createdAt: now,
      updatedAt: now,
    };
    await doc.send(new PutCommand({ TableName: TABLES.products, Item: item, ConditionExpression: "attribute_not_exists(id)" }));
    return json(201, detail(item));
  } catch (e) {
    if (e instanceof ValidationError) return error(400, "VALIDATION_ERROR", e.message, e.field);
    if ((e as any)?.name === "ConditionalCheckFailedException")
      return error(409, "SLUG_EXISTS", "A product with this id already exists.");
    throw e;
  }
}

async function updateProduct(event: any) {
  if (!isAdmin(event)) return error(403, "FORBIDDEN", "Admin access required.");
  const { id } = pathParams(event);
  const get = await doc.send(new GetCommand({ TableName: TABLES.products, Key: { id, sk: "PRODUCT" } }));
  if (!get.Item) return error(404, "PRODUCT_NOT_FOUND", `No product exists for id '${id}'.`);

  const b = parseBody(event);
  const updates: Record<string, any> = {};
  for (const k of ["name", "subtitle", "description", "category", "metal", "gemstone", "size", "slug"]) {
    if (b[k] !== undefined) updates[k] = String(b[k]);
  }
  if (b.price !== undefined) {
    const price = requireNumber(b.price, "price");
    if (price <= 0) return error(400, "VALIDATION_ERROR", "price must be greater than 0", "price");
    updates.price = price;
  }
  if (b.weightG !== undefined) updates.weightG = requireNumber(b.weightG, "weightG");
  if (b.stock !== undefined) updates.stock = Math.max(0, parseInt(String(b.stock), 10) || 0);
  if (b.isActive !== undefined) updates.isActive = !!b.isActive;
  if (b.isFeatured !== undefined) updates.isFeatured = !!b.isFeatured;
  if (b.images !== undefined) updates.images = Array.isArray(b.images) ? b.images : [];
  if (b.tags !== undefined) updates.tags = Array.isArray(b.tags) ? b.tags.map(String) : [];
  if (b.category !== undefined && b.category !== get.Item.category) {
    const catName = await getCategoryName(String(b.category));
    if (!catName) return error(400, "CATEGORY_NOT_FOUND", `Category '${b.category}' does not exist.`, "category");
    updates.categoryName = catName;
  }

  if (updates.slug) {
    const dup = await doc.send(
      new QueryCommand({
        TableName: TABLES.products,
        IndexName: "gsi_slug",
        KeyConditionExpression: "slug = :s",
        ExpressionAttributeValues: { ":s": updates.slug },
        Limit: 1,
      })
    );
    const other = dup.Items?.[0];
    if (other && other.id !== id) return error(409, "SLUG_EXISTS", `Slug '${updates.slug}' is taken.`, "slug");
  }

  updates.updatedAt = new Date().toISOString();
  const expr = "SET " + Object.keys(updates).map((k) => `#${k} = :${k}`).join(", ");
  const names = Object.fromEntries(Object.keys(updates).map((k) => [`#${k}`, k]));
  const values = Object.fromEntries(Object.keys(updates).map((k) => [`:${k}`, updates[k]]));

  const out = await doc.send(
    new UpdateCommand({
      TableName: TABLES.products,
      Key: { id, sk: "PRODUCT" },
      UpdateExpression: expr,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return json(200, detail(out.Attributes));
}

async function softDelete(event: any) {
  if (!isAdmin(event)) return error(403, "FORBIDDEN", "Admin access required.");
  const { id } = pathParams(event);
  const out = await doc.send(
    new UpdateCommand({
      TableName: TABLES.products,
      Key: { id, sk: "PRODUCT" },
      UpdateExpression: "SET isActive = :f, updatedAt = :t",
      ExpressionAttributeValues: { ":f": false, ":t": new Date().toISOString() },
      ReturnValues: "ALL_NEW",
    })
  );
  if (!out.Attributes) return error(404, "PRODUCT_NOT_FOUND", `No product exists for id '${id}'.`);
  return json(200, { id, isActive: false });
}

async function requestMedia(event: any) {
  if (!isAdmin(event)) return error(403, "FORBIDDEN", "Admin access required.");
  const { id } = pathParams(event);
  const get = await doc.send(new GetCommand({ TableName: TABLES.products, Key: { id, sk: "PRODUCT" } }));
  if (!get.Item) return error(404, "PRODUCT_NOT_FOUND", `No product exists for id '${id}'.`);

  const b = parseBody(event);
  const kind = b.kind;
  if (kind !== "hero" && kind !== "gallery") return error(400, "VALIDATION_ERROR", "kind must be 'hero' or 'gallery'", "kind");
  const contentType = b.contentType ? String(b.contentType) : "image/webp";
  if (!/^image\/(png|jpe?g|webp|avif)$/.test(contentType))
    return error(400, "VALIDATION_ERROR", `Unsupported contentType '${contentType}'.`, "contentType");

  const bucket = process.env.MEDIA_BUCKET || "aaranya-media-40a233";
  const random = crypto.randomBytes(6).toString("hex");
  const filename = b.filename && b.kind === "gallery"
    ? `products/${id}/gallery/${b.filename}`
    : `products/${id}/original_${random}.${contentType.split("/")[1] || "webp"}`;
  const key = b.kind === "hero" ? `products/${id}/original_${random}.${contentType.split("/")[1] || "webp"}` : filename;

  const url = await getSignedUrl(S3(), new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 900 });
  const cdn = process.env.CLOUDFRONT_DOMAIN || "d2wpw6wxp38zdc.cloudfront.net";
  const finalUrl = b.kind === "gallery"
    ? `https://${cdn}/products/${id}/gallery/${b.filename}`
    : `https://${cdn}/products/${id}/hero.webp`;
  return json(200, { uploadUrl: url, expiresIn: 900, finalUrl });
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (base === "/v1/products" && method === "GET") return await listProducts(event);

    if (base === "/v1/admin/products" && method === "POST") return await createProduct(event);

    if (/^\/v1\/admin\/products\/[^/]+\/images$/.test(base) && method === "POST")
      return await requestMedia(event);

    const m = base.match(/^\/v1\/products\/([^/]+)$/);
    if (m && method === "GET") return await getBySlug(m[1]);

    const adm = base.match(/^\/v1\/admin\/products\/([^/]+)$/);
    if (adm && method === "PUT") return await updateProduct({ ...event, pathParameters: { id: adm[1] } });
    if (adm && method === "DELETE") return await softDelete({ ...event, pathParameters: { id: adm[1] } });

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("products handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};