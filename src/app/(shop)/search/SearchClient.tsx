"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, ListSkeleton, ProductCard } from "@/components";
import { searchProducts } from "@/lib/api";
import type { Product } from "@/components";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = input.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setOpen(true);

    const timeout = setTimeout(() => {
      searchProducts(term)
        .then((items) => {
          if (cancelled) return;
          setResults(items);
          setSearched(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [input]);

  const suggestions = results.slice(0, 6);

  return (
    <div className="mx-auto mt-10 max-w-xl">
      <div className="relative">
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder="Search rings, jhumkas, polki…"
          className="w-full border border-forest bg-cream px-5 py-3 font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-forest"
        />

        {open && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 -mt-px border border-forest bg-cream shadow-lg">
            {suggestions.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/product/${item.slug}`}
                  onMouseDown={(event) => event.preventDefault()}
                  className="flex items-center gap-3 px-4 py-2.5 font-sans text-sm text-ink transition-colors hover:bg-creamDark hover:text-forest"
                >
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="ml-auto shrink-0 text-xs uppercase tracking-widest text-muted">
                    {item.metal}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 font-sans text-xs uppercase tracking-widest text-muted">
        {input.trim().length < 2
          ? "Type at least two characters to search"
          : loading
            ? "Searching…"
            : searched
              ? `${results.length} piece${results.length === 1 ? "" : "s"}`
              : ""}
      </p>

      {loading && (
        <div className="mt-8">
          <ListSkeleton count={6} />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          title="No pieces found"
          body={`Nothing matched “${input.trim()}”. Try “rings”, “gold”, or “polki”.`}
          cta={{ label: "View the Collection", href: "/shop" }}
        />
      )}

      {!loading && results.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}