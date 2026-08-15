"use client";

import { useEffect, useState } from "react";
import type { Category, FilterState, Gemstone, Metal } from "./types";

const METALS: Metal[] = ["22k gold", "silver", "rose gold", "platinum"];
const GEMSTONES: Gemstone[] = ["diamond", "ruby", "emerald", "polki", "none"];

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  metals: [],
  gemstones: [],
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function FilterSidebar({
  categories,
  initialFilters,
  onChange,
}: {
  categories: Category[];
  initialFilters?: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  useEffect(() => {
    const timeout = setTimeout(() => onChange(filters), 200);
    return () => clearTimeout(timeout);
  }, [filters, onChange]);

  const toggle = (key: "categories" | "metals" | "gemstones", value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const setPrice = (key: "minPrice" | "maxPrice", raw: string) => {
    const parsed = raw === "" ? undefined : Number(raw);
    const value = parsed === undefined || Number.isNaN(parsed) ? undefined : parsed;
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAll = () => {
    const reset: FilterState = { ...DEFAULT_FILTERS };
    setFilters(reset);
    onChange(reset);
  };

  return (
    <aside className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xs uppercase tracking-widest text-forest">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-forest underline underline-offset-4 hover:opacity-70 transition-opacity"
        >
          Clear all
        </button>
      </div>

      <details open>
        <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-widest text-forest">
          Category
        </summary>
        <fieldset className="mt-3 space-y-2">
          {categories.map((category) => (
            <label key={category.slug} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={filters.categories.includes(category.slug)}
                onChange={() => toggle("categories", category.slug)}
                className="accent-forest"
              />
              {category.name}
            </label>
          ))}
        </fieldset>
      </details>

      <details open>
        <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-widest text-forest">
          Metal
        </summary>
        <fieldset className="mt-3 space-y-2">
          {METALS.map((metal) => (
            <label key={metal} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={filters.metals.includes(metal)}
                onChange={() => toggle("metals", metal)}
                className="accent-forest"
              />
              {capitalize(metal)}
            </label>
          ))}
        </fieldset>
      </details>

      <details open>
        <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-widest text-forest">
          Gemstone
        </summary>
        <fieldset className="mt-3 space-y-2">
          {GEMSTONES.map((gemstone) => (
            <label key={gemstone} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={filters.gemstones.includes(gemstone)}
                onChange={() => toggle("gemstones", gemstone)}
                className="accent-forest"
              />
              {capitalize(gemstone)}
            </label>
          ))}
        </fieldset>
      </details>

      <details open>
        <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-widest text-forest">
          Price (INR)
        </summary>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <label className="flex-1">
            <span className="sr-only">Min price</span>
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={filters.minPrice ?? ""}
              onChange={(event) => setPrice("minPrice", event.target.value)}
              className="w-full border border-forest bg-cream px-2 py-1.5 text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </label>
          <span className="text-muted">–</span>
          <label className="flex-1">
            <span className="sr-only">Max price</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={filters.maxPrice ?? ""}
              onChange={(event) => setPrice("maxPrice", event.target.value)}
              className="w-full border border-forest bg-cream px-2 py-1.5 text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </label>
        </div>
      </details>
    </aside>
  );
}