import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components";
import ShopClient from "../ShopClient";
import { getAllCategories, getAllProducts } from "@/lib/api";

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await getAllCategories();
  const found = categories.find((item) => item.slug === category);
  return { title: `${found?.name ?? category} — AARANYA` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);
  const found = categories.find((item) => item.slug === category);
  if (!found) notFound();

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: found.name },
        ]}
      />
      <h1 className="mt-6 text-center font-serif text-4xl text-forest">{found.name}</h1>
      <ShopClient
        products={products}
        categories={categories}
        initialCategory={found.slug}
      />
    </div>
  );
}