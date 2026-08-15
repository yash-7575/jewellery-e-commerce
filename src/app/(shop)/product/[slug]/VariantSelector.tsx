"use client";

export default function VariantSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string;
  onChange: (size: string) => void;
}) {
  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-widest text-muted">Size</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={size === value}
            onClick={() => onChange(size)}
            className={`h-9 min-w-9 border px-2 font-sans text-sm transition-colors ${
              size === value
                ? "border-forest bg-forest text-cream"
                : "border-forest bg-cream text-forest hover:bg-creamDark"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}