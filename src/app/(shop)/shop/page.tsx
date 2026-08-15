import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";
import ShopClient from "./ShopClient";
import { getAllCategories, getAllProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "The Collection — AARANYA",
  description:
    "Hand-set diamonds & 22K gold from the AARANYA atelier in Jaipur. Rings, bangles, jhumkas, necklaces & more.",
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Shop" },
        ]}
      />
      <h1 className="mt-6 text-center font-serif text-4xl text-forest">The Collection</h1>
      <ShopClient products={products} categories={categories} />
    </div>
  );
}