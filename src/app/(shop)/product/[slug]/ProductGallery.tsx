"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  images,
  name,
  priority = false,
}: {
  images: string[];
  name: string;
  priority?: boolean;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-creamLight">
        <Image
          src={current}
          alt={`${name} — view ${active + 1} of ${images.length}`}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          priority={priority}
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              className={`relative aspect-[4/5] w-20 overflow-hidden rounded-sm transition-opacity ${
                index === active ? "ring-2 ring-forest" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}