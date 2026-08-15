"use client";

import { useMemo, useState } from "react";
import { EmptyState, FilterSidebar, ProductCard, SortSelect } from "@/components";
import type { Category, FilterState, Product, SortKey } from "@/components";

export default function ShopClient({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}) {
  const [filters, setFilters] = useState<FilterState>({
    categories: initialCategory ? [initialCategory] : [],
    metals: [],
    gemstones: [],
  });
  const [sort, setSort] = useState<SortKey>("newest");

  const visible = useMemo(() => {
    let list = products.filter((product) => {
      if (filters.categories.length && !filters.categories.includes(product.category)) return false;
      if (filters.metals.length && !filters.metals.includes(product.metal)) return false;
      if (filters.gemstones.length && !filters.gemstones.includes(product.gemstone)) return false;
      if (filters.minPrice !== undefined && product.priceInr < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && product.priceInr > filters.maxPrice) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.priceInr - b.priceInr);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.priceInr - a.priceInr);
        break;
      case "popularity":
        list = [...list].sort((a, b) => b.popularity - a.popularity);
        break;
      default:
        list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return list;
  }, [filters, products, sort]);

  return (
    <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[240px_1fr]">
      <div className="lg:sticky lg:top-24">
        <FilterSidebar categories={categories} initialFilters={filters} onChange={setFilters} />
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <p className="font-sans text-xs uppercase tracking-widest text-muted">
            {visible.length} piece{visible.length === 1 ? "" : "s"}
          </p>
          <SortSelect value={sort} onChange={setSort} />
        </div>

        {visible.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pieces found"
            body="Nothing in the atelier matches these filters. Loosen them to see the full collection."
            cta={{ label: "View the Collection", href: "/shop" }}
          />
        )}
      </div>
    </div>
  );
}