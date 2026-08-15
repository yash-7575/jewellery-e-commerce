"use client";

import type { SortKey } from "./types";

const OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "popularity", label: "Most loved" },
];

export default function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (value: SortKey) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as SortKey)}
      className="border border-forest bg-cream px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:ring-1 focus:ring-forest"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}