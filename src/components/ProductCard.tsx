import Image from "next/image";
import Link from "next/link";
import WishlistButton from "./WishlistButton";
import PriceTag from "./PriceTag";
import type { Product } from "./types";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <article className="group relative bg-cream">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-creamDark">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
          />
        </div>
      </Link>
      <WishlistButton productId={product.id} />
      <div className="mt-3">
        <h3 className="font-serif text-lg text-ink">
          <Link href={`/product/${product.slug}`} className="hover:opacity-70 transition-opacity">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 font-sans text-xs uppercase tracking-widest text-muted">
          {product.metal} · {product.weightGrams}g
        </p>
        <div className="mt-1">
          <PriceTag amountInr={product.priceInr} compareAt={product.compareAtInr} size="sm" />
        </div>
      </div>
    </article>
  );
}