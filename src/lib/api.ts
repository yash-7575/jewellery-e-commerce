import type {
  Category,
  Gemstone,
  Metal,
  Product,
} from "@/components/types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const REVALIDATE = 60;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&h=1600&q=80";

const GEMSTONE_VALUES: Gemstone[] = ["diamond", "ruby", "emerald", "polki", "none"];

const METAL_MAP: Record<string, Metal> = {
  "22k-gold": "22k gold",
  "22k gold": "22k gold",
  silver: "silver",
  "rose-gold": "rose gold",
  "rose gold": "rose gold",
  platinum: "platinum",
};

type ApiImage = { url: string; alt?: string; w?: number; h?: number };

interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  category: string;
  categoryName?: string;
  description?: string;
  metal?: string;
  gemstone?: string;
  weightG?: number;
  size?: string;
  price?: number;
  currency?: string;
  stock?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  images?: Array<ApiImage | string>;
  rating?: { average?: number; count?: number };
  tags?: string[];
  createdAt?: string;
  popularity?: number;
}

interface ApiList<T> {
  items: T[];
  count?: number;
  nextCursor?: string | null;
}

const toMetal = (value: string | undefined): Metal => METAL_MAP[value ?? ""] ?? "22k gold";

const toGemstone = (value: string | undefined): Gemstone =>
  GEMSTONE_VALUES.includes(value as Gemstone) ? (value as Gemstone) : "none";

const imageUrls = (images?: Array<ApiImage | string>): string[] => {
  const urls = (images ?? [])
    .map((image) => (typeof image === "string" ? image : image.url))
    .filter(Boolean);
  return urls.length > 0 ? urls : [FALLBACK_IMAGE];
};

const mapProduct = (raw: ApiProduct): Product => ({
  id: raw.id,
  slug: raw.slug,
  name: raw.name,
  category: raw.category,
  metal: toMetal(raw.metal),
  gemstone: toGemstone(raw.gemstone),
  weightGrams: raw.weightG ?? 0,
  priceInr: raw.price ?? 0,
  stock: raw.stock ?? (raw.inStock === false ? 0 : 5),
  shortDescription: raw.subtitle ?? "",
  longDescription: raw.description ?? raw.subtitle ?? "",
  images: imageUrls(raw.images),
  createdAt: raw.createdAt ?? new Date().toISOString(),
  popularity: raw.popularity ?? raw.rating?.count ?? 0,
  attributes: {
    categoryName: raw.categoryName,
    size: raw.size,
    isFeatured: raw.isFeatured,
    tags: raw.tags,
    rating: raw.rating,
  },
});

const u = (id: string, w = 1200, h = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const MOCK_CATEGORIES: Category[] = [
  { id: "CAT-RING", slug: "rings", name: "Rings", productCount: 14, displayOrder: 1 },
  { id: "CAT-EARR", slug: "earrings", name: "Earrings", productCount: 21, displayOrder: 2 },
  { id: "CAT-NECK", slug: "necklaces", name: "Necklaces", productCount: 18, displayOrder: 3 },
  { id: "CAT-BRAC", slug: "bracelets", name: "Bracelets", productCount: 9, displayOrder: 4 },
  { id: "CAT-BANG", slug: "bangles", name: "Bangles", productCount: 27, displayOrder: 5 },
  { id: "CAT-JHUM", slug: "jhumkas", name: "Jhumkas", productCount: 12, displayOrder: 6 },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "P-0001",
    slug: "genda-jhumka",
    name: "Genda Jhumka",
    category: "jhumkas",
    metal: "22k gold",
    gemstone: "ruby",
    weightGrams: 14.2,
    priceInr: 58000,
    stock: 8,
    shortDescription: "22K Gold · Ruby Meenakari",
    longDescription:
      "A temple-jhumka silhouette in hand-woven 22K gold, its canopy kissed with ruby meenakari. Every petal is shaped by hand & the tassels finished with tiny gold pellets.",
    images: [u("photo-1515562141207-7a88fb7ce338"), u("photo-1617038260897-41a1f14a8ca0")],
    createdAt: "2026-08-01T10:00:00Z",
    popularity: 412,
    attributes: { rating: { average: 4.8, count: 96 }, isFeatured: true },
  },
  {
    id: "P-0002",
    slug: "mogra-bangle",
    name: "Mogra Bangle",
    category: "bangles",
    metal: "22k gold",
    gemstone: "polki",
    weightGrams: 18.4,
    priceInr: 128000,
    stock: 5,
    shortDescription: "22K Gold · Uncut Polki",
    longDescription:
      "Hand-set uncut polki on hand-woven 22K gold wire, named for the jasmine it evokes. Twelve stones, each burnished in the Jaipur tradition of kundan.",
    images: [u("photo-1506630448388-4e683c67ddb0"), u("photo-1543294001-f7cd5d7fb516")],
    createdAt: "2026-07-10T09:00:00Z",
    popularity: 328,
    attributes: { rating: { average: 4.9, count: 41 }, isFeatured: true },
  },
  {
    id: "P-0003",
    slug: "kamal-ruby-necklace",
    name: "Kamal Ruby Necklace",
    category: "necklaces",
    metal: "22k gold",
    gemstone: "ruby",
    weightGrams: 26.8,
    priceInr: 185000,
    compareAtInr: 210000,
    stock: 3,
    shortDescription: "22K Gold · Handwoven & Ruby",
    longDescription:
      "A lotus-flower collar of hammered 22K gold, strung with pigeon-blood rubies. Worn close to the throat, it catches candlelight the way old Jaipur meant it to.",
    images: [u("photo-1611652022419-a9419f74343d"), u("photo-1543294001-f7cd5d7fb516")],
    createdAt: "2026-08-10T08:30:00Z",
    popularity: 511,
    attributes: { rating: { average: 4.7, count: 63 }, isFeatured: true },
  },
  {
    id: "P-0004",
    slug: "panna-kundan-ring",
    name: "Panna Kundan Ring",
    category: "rings",
    metal: "22k gold",
    gemstone: "emerald",
    weightGrams: 9.6,
    priceInr: 95000,
    stock: 12,
    shortDescription: "22K Gold · Emerald Kundan",
    longDescription:
      "A single Zambian emerald held in a filigree of 22K gold, bordered by seed polki. Light passes through the stone untouched & returns for hours.",
    images: [u("photo-1599643478518-a784e5dc4c8f"), u("photo-1515562141207-7a88fb7ce338")],
    createdAt: "2026-06-22T11:00:00Z",
    popularity: 287,
    attributes: {
      rating: { average: 4.6, count: 22 },
      sizes: ["48", "50", "52", "54"],
    },
  },
  {
    id: "P-0005",
    slug: "priya-silver-pendant",
    name: "Priya Silver Pendant",
    category: "necklaces",
    metal: "silver",
    gemstone: "diamond",
    weightGrams: 6.1,
    priceInr: 42500,
    stock: 15,
    shortDescription: "Sterling Silver · Diamond",
    longDescription:
      "A luminous drop of sterling silver set with a single solitaire, suspended from a trace chain. Quiet on the collarbone, unmistakable up close.",
    images: [u("photo-1605100804763-247f67b3557e"), u("photo-1611652022419-a9419f74343d")],
    createdAt: "2026-08-05T12:00:00Z",
    popularity: 174,
    attributes: { rating: { average: 4.9, count: 15 } },
  },
  {
    id: "P-0006",
    slug: "chandra-silver-chain",
    name: "Chandra Silver Chain",
    category: "bracelets",
    metal: "silver",
    gemstone: "none",
    weightGrams: 22.9,
    priceInr: 32000,
    stock: 9,
    shortDescription: "Sterling Silver · Hand-Formed",
    longDescription:
      "Rounded links formed by hand, named for the moon. The metal is left soft so it warms to the wearer & keeps the memory of hammer marks.",
    images: [u("photo-1573408301186-9146fe634bc0"), u("photo-1506630448388-4e683c67ddb0")],
    createdAt: "2026-05-30T07:00:00Z",
    popularity: 133,
    attributes: { rating: { average: 4.5, count: 19 } },
  },
  {
    id: "P-0007",
    slug: "aarav-signet-band",
    name: "Aarav Signet Band",
    category: "rings",
    metal: "platinum",
    gemstone: "diamond",
    weightGrams: 8.2,
    priceInr: 110000,
    stock: 4,
    shortDescription: "Platinum · Diamond",
    longDescription:
      "A clean signet plane in platinum, set with a single square brilliant. The proportions are monastic — restraint carried to the last unnecessary line removed.",
    images: [u("photo-1610374792793-f019b754acf4"), u("photo-1601121141461-9d6647bca1ed")],
    createdAt: "2026-08-08T14:00:00Z",
    popularity: 402,
    attributes: {
      rating: { average: 4.8, count: 34 },
      sizes: ["16", "17", "18", "19"],
    },
  },
  {
    id: "P-0008",
    slug: "meera-solitaire-earrings",
    name: "Meera Solitaire Earrings",
    category: "earrings",
    metal: "platinum",
    gemstone: "diamond",
    weightGrams: 5.7,
    priceInr: 88000,
    compareAtInr: 104000,
    stock: 6,
    shortDescription: "Platinum · Hand-set Diamond",
    longDescription:
      "Two hand-set solitaires in sculpted platinum, each stone cut to mirror the one opposite it. The light they throw is deliberate, never loud.",
    images: [u("photo-1617038260897-41a1f14a8ca0"), u("photo-1610374792793-f019b754acf4")],
    createdAt: "2026-07-18T09:30:00Z",
    popularity: 356,
    attributes: { rating: { average: 4.7, count: 28 } },
  },
];

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API}${path}`, init);
  if (!response.ok) {
    throw new Error(`AARANYA API ${path} responded ${response.status}`);
  }
  return (await response.json()) as T;
};

export async function getAllProducts(): Promise<Product[]> {
  if (!API) return MOCK_PRODUCTS;
  const data = await fetchJson<ApiList<ApiProduct>>("/v1/products", {
    next: { revalidate: REVALIDATE },
  });
  return (data.items ?? []).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!API) return MOCK_PRODUCTS.find((product) => product.slug === slug) ?? null;
  try {
    const raw = await fetchJson<ApiProduct>(`/v1/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE },
    });
    return mapProduct(raw);
  } catch {
    return null;
  }
}

export async function getRelatedProducts(
  category: string,
  excludeId?: string,
): Promise<Product[]> {
  if (!API) {
    return MOCK_PRODUCTS.filter((product) => product.category === category && product.id !== excludeId).slice(0, 4);
  }
  const data = await fetchJson<ApiList<ApiProduct>>(
    `/v1/products?category=${encodeURIComponent(category)}`,
    { next: { revalidate: REVALIDATE } },
  );
  return (data.items ?? [])
    .map(mapProduct)
    .filter((product) => product.id !== excludeId)
    .slice(0, 4);
}

export async function getAllCategories(): Promise<Category[]> {
  if (!API) return MOCK_CATEGORIES;
  const data = await fetchJson<ApiList<Category>>("/v1/categories", {
    next: { revalidate: REVALIDATE },
  });
  return (data.items ?? []).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function searchProducts(q: string): Promise<Product[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  if (!API) {
    const needle = term.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (product) =>
        product.name.toLowerCase().includes(needle) ||
        product.shortDescription.toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle),
    );
  }
  const data = await fetchJson<ApiList<ApiProduct>>(
    `/v1/search?q=${encodeURIComponent(term)}`,
  );
  return (data.items ?? []).map(mapProduct);
}