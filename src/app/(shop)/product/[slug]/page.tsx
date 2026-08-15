import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PriceTag, ProductCard } from "@/components";
import AddToBag from "./AddToBag";
import ProductGallery from "./ProductGallery";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/api";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} — AARANYA` : "Not Found — AARANYA",
    description: product?.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.id);

  const sizes = Array.isArray(product.attributes?.sizes)
    ? (product.attributes.sizes as string[])
    : [];
  const rating =
    (product.attributes?.rating as { average?: number; count?: number } | undefined) ?? {
      average: 0,
      count: 0,
    };
  const average = rating.average ?? 0;
  const count = rating.count ?? 0;
  const starCount = Math.round(average);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 items-start gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} priority />

        <div className="flex flex-col">
          <h1 className="font-serif text-4xl text-ink">{product.name}</h1>
          <p className="mt-3 font-sans text-sm uppercase tracking-widest text-muted">
            {product.metal} · {product.weightGrams}g
          </p>

          <div className="mt-4">
            <PriceTag amountInr={product.priceInr} compareAt={product.compareAtInr} size="lg" />
          </div>

          {product.shortDescription && (
            <p className="mt-4 font-sans text-base leading-relaxed text-ink/85">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-8">
            <AddToBag sizes={sizes} stock={product.stock} />
          </div>

          <div className="mt-8 border-t border-black/5 pt-6">
            <p className="eyebrow">The Craft</p>
            <p className="mt-3 font-sans text-base leading-relaxed text-ink/85">
              {product.longDescription}
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-center font-serif text-4xl text-forest">
            You may also <span className="font-serif-i">love</span>
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 border-t border-black/5 pt-10">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex items-center gap-1 font-sans text-xl text-forest"
            aria-label={`Rated ${average} out of 5`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} className={index < starCount ? "text-forest" : "text-ink/20"}>
                ★
              </span>
            ))}
          </div>
          <p className="font-sans text-sm text-ink">
            {average > 0 && <span>{average.toFixed(1)} · </span>}
            {count} review{count === 1 ? "" : "s"}
          </p>
        </div>
        <p className="mt-3 font-sans text-xs text-muted">
          Verified client reviews appear here — each one tied to a purchase from the atelier.
        </p>
      </section>
    </div>
  );
}