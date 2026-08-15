"use client";

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center font-sans">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex h-10 w-10 items-center justify-center border border-forest text-forest hover:bg-creamDark transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        −
      </button>
      <input
        type="number"
        aria-label="Quantity"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (!Number.isNaN(parsed)) {
            onChange(Math.min(Math.max(parsed, min), max));
          }
        }}
        className="h-10 w-12 border-y border-forest text-center text-sm text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex h-10 w-10 items-center justify-center border border-forest text-forest hover:bg-creamDark transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  );
}