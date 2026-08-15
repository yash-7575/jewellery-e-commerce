import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "ap-south-1";
const CATEGORIES_TABLE = "aaranya-categories";
const PRODUCTS_TABLE = "aaranya-products";

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=1200&auto=format&fit=crop`;

const POOL = {
  ring: ["1515562141207-7a88fb7ce338", "1603561591411-07134e71a2a9", "1605100804763-247f67b3557e", "1611652022419-a9419f74343d"],
  necklace: ["1599643478518-a784e5dc4c8f", "1601121141461-9d6647bca1ed", "1620656798579-1984d9e87df7", "1522312346375-d1a52e2b99b3"],
  earring: ["1518640467707-6811f4a6ab73", "1591382386627-349b692688ff", "1601924994987-69e26d50dc26", "1611591437281-460bfbe1220a"],
  bracelet: ["1573408301185-9146fe634ad0", "1617038220319-276d3cfab638", "1535632066927-ab7c9ab60908", "1605100804763-247f67b3557e"],
  bangle: ["1617038220319-276d3cfab638", "1573408301185-9146fe634ad0", "1535632066927-ab7c9ab60908", "1601121141461-9d6647bca1ed"],
  jhumka: ["1601924994987-69e26d50dc26", "1591382386627-349b692688ff", "1518640467707-6811f4a6ab73", "1611591437281-460bfbe1220a"],
};

const now = Date.now();
const daysAgo = (n, h = "10:00:00") => new Date(now - n * 86400000).toISOString().replace(/\d{2}:\d{2}:\d{2}\.\d{3}Z$/, `${h}Z`);

const categories = [
  { id: "CAT-RING", slug: "rings", name: "Rings", image: IMG("1515562141207-7a88fb7ce338"), sortOrder: 1 },
  { id: "CAT-NECK", slug: "necklaces", name: "Necklaces", image: IMG("1599643478518-a784e5dc4c8f"), sortOrder: 2 },
  { id: "CAT-EARR", slug: "earrings", name: "Earrings", image: IMG("1518640467707-6811f4a6ab73"), sortOrder: 3 },
  { id: "CAT-BRAC", slug: "bracelets", name: "Bracelets", image: IMG("1573408301185-9146fe634ad0"), sortOrder: 4 },
  { id: "CAT-BANG", slug: "bangles", name: "Bangles", image: IMG("1617038220319-276d3cfab638"), sortOrder: 5 },
  { id: "CAT-JHUM", slug: "jhumkas", name: "Jhumkas", image: IMG("1601924994987-69e26d50dc26"), sortOrder: 6 },
].map((c, i) => ({
  id: c.id,
  sk: "META",
  slug: c.slug,
  name: c.name,
  imageUrl: c.image,
  image: c.image,
  displayOrder: c.sortOrder,
  sortOrder: c.sortOrder,
  isActive: true,
  createdAt: daysAgo(89 - i * 3),
  updatedAt: daysAgo(1),
}));

const P = {
  jhumka: (id, opts) => ({
    id, sk: "PRODUCT", categoryId: "CAT-JHUM", category: "jhumkas", pool: "jhumka",
    metal: "22k-gold", gemstone: "polki", ...opts,
  }),
  necklace: (id, opts) => ({
    id, sk: "PRODUCT", categoryId: "CAT-NECK", category: "necklaces", pool: "necklace",
    metal: "22k-gold", gemstone: "polki", ...opts,
  }),
  bangle: (id, opts) => ({
    id, sk: "PRODUCT", categoryId: "CAT-BANG", category: "bangles", pool: "bangle",
    metal: "22k-gold", gemstone: "none", ...opts,
  }),
  ring: (id, opts) => ({
    id, sk: "PRODUCT", categoryId: "CAT-RING", category: "rings", pool: "ring",
    metal: "22k-gold", gemstone: "diamond", ...opts,
  }),
  bracelet: (id, opts) => ({
    id, sk: "PRODUCT", categoryId: "CAT-BRAC", category: "bracelets", pool: "bracelet",
    metal: "22k-gold", gemstone: "none", ...opts,
  }),
  earring: (id, opts) => ({
    id, sk: "PRODUCT", categoryId: "CAT-EARR", category: "earrings", pool: "earring",
    metal: "silver", gemstone: "diamond", ...opts,
  }),
};

const raw = [
  P.jhumka("P-1001", {
    slug: "genda-marigold-jhumka", name: "Genda Marigold Jhumka",
    subtitle: "22K Gold · Uncut Polki", weightG: 9.6, price: 27500, compareAtInr: 33000,
    stock: 18, popularity: 92, isFeatured: true, createdAt: daysAgo(12),
    size: "One size (6.5cm drop)",
    attributes: { style: "Traditional dome", dropLength: "6.5 cm" },
  }),
  P.jhumka("P-1002", {
    slug: "bikh-baddi-raw-silver-jhumka", name: "Bikh Baddi Jhumka",
    subtitle: "Pure Silver · Matka", metal: "silver", gemstone: "none", weightG: 4.2,
    price: 9500, stock: 32, popularity: 66, isFeatured: false, createdAt: daysAgo(58),
    size: "One size (4.8cm drop)",
    attributes: { style: "Matka dome", dropLength: "4.8 cm" },
  }),
  P.jhumka("P-1003", {
    slug: "krishna-naag-chandra-jhumka", name: "Krishna Naag Chandra Jhumka",
    subtitle: "22K Gold · Naag Motif", weightG: 12.8, price: 41200, compareAtInr: 49000,
    stock: 11, popularity: 79, isFeatured: true, createdAt: daysAgo(5),
    size: "One size (7.2cm drop)",
    attributes: { style: "Naag & chandra", dropLength: "7.2 cm" },
  }),
  P.necklace("P-2001", {
    slug: "polki-reverie-necklace", name: "Polki Reverie Necklace",
    subtitle: "22K Gold · Uncut Polki", weightG: 21.5, price: 245000, compareAtInr: 295000,
    stock: 6, popularity: 96, isFeatured: true, createdAt: daysAgo(2),
    attributes: { closure: "Double box clasp", length: "46 cm", stones: "~21 carat uncut polki" },
  }),
  P.necklace("P-2002", {
    slug: "vaishnavi-pendant-necklace", name: "Vaishnavi Pendant Necklace",
    subtitle: "Pure Silver · Brilliant-cut Diamond", metal: "silver", gemstone: "diamond",
    weightG: 12.0, price: 48500, stock: 20, popularity: 71, isFeatured: false, createdAt: daysAgo(33),
    attributes: { closure: "Lobster clasp", length: "43 cm", pendant: "2.1 cm" },
  }),
  P.necklace("P-2003", {
    slug: "meera-temple-necklace", name: "Meera Temple Necklace",
    subtitle: "22K Gold · Temple Work · Ruby", gemstone: "ruby", weightG: 34.2,
    price: 185000, compareAtInr: 220000, stock: 5, popularity: 90, isFeatured: true, createdAt: daysAgo(9),
    attributes: { closure: "Screw-pin clasp", length: "48 cm", motif: "Goddess & peacock panels" },
  }),
  P.bangle("P-3001", {
    slug: "mogra-bangle-22k", name: "Mogra Bangle in 22K",
    subtitle: "22K Gold · Handwoven", weightG: 18.4, price: 128000, compareAtInr: 158000,
    stock: 10, popularity: 88, isFeatured: true, createdAt: daysAgo(21),
    size: "Medium (16mm inner dia)",
    attributes: { sizes: ["Small (5.5cm dia)", "Medium (5.9cm dia)", "Large (6.3cm dia)"], width: "8 mm" },
  }),
  P.bangle("P-3002", {
    slug: "heer-baandhani-bangle", name: "Heer Baandhani Bangle",
    subtitle: "22K Gold · Baandhani Etch", weightG: 15.6, price: 84500, compareAtInr: 102000,
    stock: 14, popularity: 77, isFeatured: false, createdAt: daysAgo(44),
    size: "One size (6.1cm inner dia)",
    attributes: { sizes: ["Medium (5.9cm dia)", "Large (6.3cm dia)"], width: "7 mm" },
  }),
  P.bangle("P-3003", {
    slug: "dulhan-diamond-bangle-set", name: "Dulhan Diamond Bangle Set",
    subtitle: "22K Gold · Brilliant-cut Diamond", gemstone: "diamond", weightG: 22.5,
    price: 138000, compareAtInr: 168000, stock: 6, popularity: 94, isFeatured: true, createdAt: daysAgo(1),
    size: "Medium (16.5mm inner dia)",
    attributes: { set: true, sizes: ["Medium (5.9cm dia)", "Large (6.3cm dia)"], stones: "~40 brilliant-cut" },
  }),
  P.ring("P-4001", {
    slug: "ambra-emerald-ring", name: "Ambra Emerald Ring",
    subtitle: "22K Gold · Zambian Emerald", gemstone: "emerald", weightG: 6.8,
    price: 72500, stock: 22, popularity: 74, isFeatured: false, createdAt: daysAgo(15),
    size: "US 7",
    attributes: { sizes: ["6", "7", "8"], setting: "Prong, 1.2 ct emerald" },
  }),
  P.ring("P-4002", {
    slug: "kundan-royale-ring", name: "Kundan Royale Ring",
    subtitle: "Rose Gold · Kundan Polki", metal: "rose-gold", gemstone: "polki", weightG: 7.2,
    price: 38500, stock: 30, popularity: 63, isFeatured: false, createdAt: daysAgo(61),
    size: "US 6",
    attributes: { sizes: ["6", "7", "8"], setting: "Kundan bezel" },
  }),
  P.ring("P-4003", {
    slug: "panna-navratna-ring", name: "Panna Navratna Ring",
    subtitle: "22K Gold · Emerald Navratna", gemstone: "emerald", weightG: 5.4,
    price: 48500, stock: 26, popularity: 58, isFeatured: false, createdAt: daysAgo(27),
    size: "US 7",
    attributes: { sizes: ["6", "7", "8"], setting: "Bead setting" },
  }),
  P.ring("P-4004", {
    slug: "lehar-polki-ring", name: "Lehar Polki Ring",
    subtitle: "22K Gold · Polki Wave", gemstone: "polki", weightG: 6.1, price: 31200,
    stock: 28, popularity: 55, isFeatured: false, createdAt: daysAgo(74),
    size: "US 6",
    attributes: { sizes: ["5", "6", "7"], setting: "Onlay polki" },
  }),
  P.bracelet("P-5001", {
    slug: "rani-ruby-kada", name: "Rani Ruby Kada",
    subtitle: "22K Gold · Burmese Ruby", gemstone: "ruby", weightG: 16.2,
    price: 96000, compareAtInr: 118000, stock: 8, popularity: 85, isFeatured: true, createdAt: daysAgo(7),
    size: "Large (6.4cm inner dia)",
    attributes: { sizes: ["Medium (6.1cm dia)", "Large (6.5cm dia)"], width: "12 mm" },
  }),
  P.bracelet("P-5002", {
    slug: "suhani-rose-kada", name: "Suhani Rose Kada",
    subtitle: "Rose Gold · Hand-finished", metal: "rose-gold", gemstone: "none", weightG: 13.0,
    price: 32500, stock: 24, popularity: 60, isFeatured: false, createdAt: daysAgo(51),
    size: "One size (6.2cm inner dia)",
    attributes: { sizes: ["Small (5.8cm dia)", "Medium (6.2cm dia)"], width: "9 mm" },
  }),
  P.bracelet("P-5003", {
    slug: "mehtab-diamond-cuff", name: "Mehtab Diamond Cuff",
    subtitle: "Platinum · Pavilion Setting", metal: "platinum", gemstone: "diamond", weightG: 11.9,
    price: 118000, compareAtInr: 146000, stock: 7, popularity: 84, isFeatured: true, createdAt: daysAgo(18),
    size: "One size (open cuff)",
    attributes: { style: "Open cuff", stones: "~2.4 ct pavilion set" },
  }),
  P.earring("P-6001", {
    slug: "anahata-cascade-earrings", name: "Anahata Cascade Earrings",
    subtitle: "Pure Silver · Diamond Cascade", metal: "silver", gemstone: "diamond", weightG: 11.4,
    price: 24000, stock: 25, popularity: 68, isFeatured: false, createdAt: daysAgo(39),
    size: "One size (5.1cm drop)",
    attributes: { style: "Cascade chandelier", dropLength: "5.1 cm", closure: "Push-back" },
  }),
  P.earring("P-6002", {
    slug: "chandbali-meenakari-earrings", name: "Chandbali Meenakari Earrings",
    subtitle: "22K Gold · Meenakari & Polki", metal: "22k-gold", gemstone: "polki", weightG: 14.1,
    price: 65500, compareAtInr: 79000, stock: 12, popularity: 80, isFeatured: true, createdAt: daysAgo(3),
    size: "One size (6.8cm drop)",
    attributes: { style: "Chandbali", dropLength: "6.8 cm", enamel: "Reverse meenakari" },
  }),
  P.earring("P-6003", {
    slug: "rukmani-diamond-studs", name: "Rukmani Diamond Studs",
    subtitle: "Platinum · Solitaire Pair", metal: "platinum", gemstone: "diamond", weightG: 5.8,
    price: 89000, compareAtInr: 106000, stock: 9, popularity: 82, isFeatured: false, createdAt: daysAgo(24),
    size: "US 0",
    attributes: { style: "Solitaire studs", setting: "Six-prong", stones: "0.8 ct pair" },
  }),
  P.earring("P-6004", {
    slug: "aasha-handforged-earrings", name: "Aasha Handforged Earrings",
    subtitle: "Rose Gold · Hammered Hoops", metal: "rose-gold", gemstone: "none", weightG: 7.6,
    price: 14500, stock: 35, popularity: 49, isFeatured: false, createdAt: daysAgo(83),
    size: "One size (3.5cm dia)",
    attributes: { style: "Hammered hoop", cause: true, closure: "Hinged" },
  }),
];

const COPY = {
  "P-1001": {
    short: "Marigold-bright gold, hand-carved into petals that catch the evening.",
    long: "The genda jhumka charms like a marigold garland caught in gold. Each petal is chased by hand in the old Jaipur manner, then set with uncut polki that holds the lamplight rather than returns it. It sways gently with every step, made for the wedding floor and the day after.",
  },
  "P-1002": {
    short: "A raw-silver matka, quiet as brass bells after the aarti.",
    long: "Bikh baddi is the sound of an old house — a matka dome of pure silver, hammered thin and left unpolished. It wears like memory and patinas beautifully, more silver character with every year. Light enough to forget, present enough to be noticed.",
  },
  "P-1003": {
    short: "Naag coils and a crescent moon, fused in 22K gold.",
    long: "The naag coils rise toward a chandra as old carvings do on temple lintels. Set with polki on a dusky gold dome, the Krishna jhumka is ceremonial without ceremony. It lands with a soft weight, the gold warming to skin within moments.",
  },
  "P-2001": {
    short: "Uncut polki set in waves of hand-woven 22K gold.",
    long: "Polki Reverie is the atelier's meditation on reflection — stones uncut, unforced, set in hand-woven gold like stars in a slow river. Each polki is a rough-cut mirror chosen for its depth, not its shine. An heirloom the length of a generation.",
  },
  "P-2002": {
    short: "A silver pendant with brilliant-cut diamond, cut for daily devotion.",
    long: "The Vaishnavi pendant rests where a tika would, a single brilliant-cut diamond held in pure silver. Designed for the working day and the quiet evening, it catches light without declaring itself. Adjustable, balanced, unhurried.",
  },
  "P-2003": {
    short: "Temple panels, rubies, and a hundred-year-old craftsman's rhythm.",
    long: "Meera is the necklace of the temple courtyard — arched panels of hand-engraved gold, seeded with pigeon-blood rubies, connected by a screw-pin clasp of the old sort. It belongs to festivals and intergenerational weddings, made to outlast fashion. Each panel is chased, never cast.",
  },
  "P-3001": {
    short: "Mogra buds of hand-woven 22K gold around the wrist.",
    long: "Named for the jasmine that grids Jaipur's old gardens, the Mogra bangle is built from thin strands of 22K gold woven into bud-and-vine. It slides on like a soft serenade and stacks beautifully beside silver. Made to be worn daily and handed down still warm.",
  },
  "P-3002": {
    short: "Baandhani etchings, perhaps the atelier's softest line.",
    long: "Heer draws on Rajasthan's baandhani — the tie-dye that facades the havelis — translated into etched gold. The pattern winds the whole bangle in a single continuous line, never meeting, never ending. A tribute to patience, finished by hand.",
  },
  "P-3003": {
    short: "A bride's bangle set, brilliant-cut diamond on 22K gold.",
    long: "The Dulhan set arrives as three graduated bangles, each set with brilliant-cut diamonds that have been baguette-checked against the gold. Designed for the wedding hand, it catches every flash of the mehndi floor. Sized generously to layer over silk.",
  },
  "P-4001": {
    short: "A Zambian emerald, prong-set like a garden in gold.",
    long: "Ambra centers a Zambian emerald of confit-green depth, held in a classic four-prong head of 22K gold. The shoulders taper into fine milgrain, the way Jaipur setters taper bas in miniature. A ring for white silk and winter daylight.",
  },
  "P-4002": {
    short: "Kundan-set polki in warm rose gold, built like a miniature palette.",
    long: "The Kundan Royale ring is meenakari inside a rose-gold bezel — enamel in forest and cream beneath, uncut polki above, sealed the traditional way without a single claw. It gives colour its own room. Made in the atelier's smallest workshop.",
  },
  "P-4003": {
    short: "Emerald steps around a bead-set stone, navratna in miniature.",
    long: "Panna places a single emerald in the centre of nine bead-set surrounds, a navratna reduced to a whisper. The band is hand-formed 22K gold, warm and slightly irregular. Wear it when the room needs one more quiet, green accent.",
  },
  "P-4004": {
    short: "A wave of polki set onlay, moving like water over the hand.",
    long: "Lehar's band breaks into three waves, each carrying uncut polki onlay that tumbles toward the finger like foam. It sits low and comfortable, a ring for handwriting and tea. Nothing about it is symmetrical — nothing about a wave is.",
  },
  "P-5001": {
    short: "A kada of pure 22K gold set with Burmese rubies at the seat.",
    long: "Rani is a solid kada, its weight a promise, its rubies seated like bangles on temple wrists. The gold is drawn, not molded, so the piece keeps the rhythm of the craftsman's hammer. It announces itself with every gesture.",
  },
  "P-5002": {
    short: "Rose gold, hand-finished, for the wrist that loves colour.",
    long: "Suhani is a rose-gold kada in the softest blush, its surface finished by hand so no two catches of light are alike. Slim enough for everyday, solid enough to matter. It warms a silver stack or stands alone.",
  },
  "P-5003": {
    short: "A platinum cuff pavilion-set with diamonds, cut like a pavilion.",
    long: "Mehtab is built on an open cuff — no clasp, no ceremony — pavilion-setting diamonds flush into platinum so the hand stays smooth. The stones glow under fabric and candle alike. A cuff for the woman who signs her cards with a degree of intent.",
  },
  "P-6001": {
    short: "Silver cascades of brilliant-cut diamond, a quiet chandelier.",
    long: "Anahata is a chandelier built low: three silver cascades, each ending in a brilliant-cut diamond, moving with the neck rather than against it. It is the earring for long dinners and slower evenings. Finished with push-back closure, unheard.",
  },
  "P-6002": {
    short: "Chandbalis in gold and meenakari, swaying like temple bells.",
    long: "Reverse meenakari — enamel painted on the gold's underside — makes Chandbali glow twice, once from pigment and once from flame. Uncut polki crowns the dome, gold granules trace the rim. It is the classic Jaipur earring, done the classic way.",
  },
  "P-6003": {
    short: "A solitaire pair in platinum, cut for the everyday of one's life.",
    long: "Rukmani is a solitaire pair in the truest cipher — two stones, six prongs each, platinum that never yellows. Mounted for security and for comfort, the diamonds sit above the lobe like small, certain stars. Bought once, worn for decades.",
  },
  "P-6004": {
    short: "Handforged rose-gold hoops, hammered to hold a soft light.",
    long: "Aasha is a simple hoop that refuses to be simple: hammered by hand so the surface catches light in a thousand soft dents. Rose gold, hinged closure, no stones — the earring that finishes a look without ever asking to be noticed. Built in support of women artisans.",
  },
};

const products = raw.map((p) => {
  const copy = COPY[p.id];
  const images = POOL[p.pool].slice(0, 2 + (p.id.endsWith("1") ? 2 : 1)).map(IMG);
  return {
    id: p.id,
    sk: p.sk,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category,
    categoryId: p.categoryId,
    shortDescription: copy.short,
    longDescription: copy.long,
    description: copy.short,
    metal: p.metal,
    gemstone: p.gemstone,
    weightG: p.weightG,
    weightGrams: p.weightG,
    price: p.price,
    priceInr: p.price,
    compareAtInr: p.compareAtInr ?? null,
    currency: "INR",
    stock: p.stock,
    isActive: true,
    isFeatured: p.isFeatured ?? true,
    images,
    rating: { average: 4.5 + Math.round(p.popularity / 60) / 10, count: 6 + (p.popularity % 18) },
    tags: [p.category, p.metal, p.gemstone],
    popularity: p.popularity,
    attributes: p.attributes ?? {},
    size: p.size ?? null,
    createdAt: p.createdAt,
    updatedAt: p.createdAt,
  };
});

async function writeChunks(table, items) {
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await ddb.send(new BatchWriteCommand({
      RequestItems: { [table]: chunk.map((item) => ({ PutRequest: { Item: item } })) },
    }));
  }
}

async function main() {
  await writeChunks(CATEGORIES_TABLE, categories);
  await writeChunks(PRODUCTS_TABLE, products);
  console.log(`Seeded ${categories.length} categories and ${products.length} products into aaranya-categories and aaranya-products`);
}

main().catch((err) => { console.error(err); process.exit(1); });