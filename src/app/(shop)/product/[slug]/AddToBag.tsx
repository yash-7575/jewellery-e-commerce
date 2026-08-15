"use client";

import { useState } from "react";
import { Button, QuantityStepper } from "@/components";
import VariantSelector from "./VariantSelector";

export default function AddToBag({
  sizes,
  stock,
}: {
  sizes: string[];
  stock: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>(sizes[0] ?? "");
  const max = Math.min(Math.max(stock, 1), 10);

  return (
    <div className="flex flex-col gap-6">
      {sizes.length > 0 && (
        <VariantSelector sizes={sizes} value={size} onChange={setSize} />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper value={quantity} onChange={setQuantity} max={max} />
        <Button variant="primary" size="lg">
          Add to bag
        </Button>
      </div>

      <Button variant="ghost" size="md" className="w-full sm:w-auto">
        Add to wishlist
      </Button>
    </div>
  );
}