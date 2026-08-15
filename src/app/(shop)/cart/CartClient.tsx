"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Button, EmptyState, PriceTag, QuantityStepper } from "@/components";
import { useCart } from "@/lib/cart";

export default function CartClient() {
  const { items, count, subtotal, ready, removeFromCart, setQuantity } = useCart();
  const [promo, setPromo] = useState("");

  if (!ready) {
    return (
      <div className="mt-10 animate-pulse space-y-6">
        <div className="h-24 bg-creamDark" />
        <div className="h-24 bg-creamDark" />
        <div className="h-40 bg-creamDark" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        body="Every piece is set by hand in Jaipur. Begin with the collection."
        cta={{ label: "Explore the collection", href: "/shop" }}
      />
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-black/5 border-y border-black/5">
        {items.map((item) => (
          <li key={item.productId} className="flex flex-wrap items-start gap-6 py-6">
            <Link
              href={`/product/${item.slug}`}
              className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-sm bg-creamLight"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.slug}`}
                className="font-serif text-lg text-ink hover:opacity-70 transition-opacity"
              >
                {item.name}
              </Link>
              {item.metal && (
                <p className="mt-1 font-sans text-xs uppercase tracking-widest text-muted">
                  {item.metal}
                </p>
              )}
              {item.size && (
                <p className="mt-0.5 font-sans text-xs text-muted">Size {item.size}</p>
              )}
              <div className="mt-3">
                <QuantityStepper
                  value={item.quantity}
                  onChange={(next) => setQuantity(item.productId, next)}
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <PriceTag amountInr={item.priceInr * item.quantity} size="md" />
              <button
                type="button"
                onClick={() => removeFromCart(item.productId)}
                className="border border-forest bg-cream px-3 py-1.5 font-sans text-xs font-medium text-forest transition-colors hover:bg-creamDark"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-24">
        <div className="border border-black/5 bg-creamLight p-8">
          <h2 className="eyebrow">Order summary</h2>

          <dl className="mt-6 space-y-4 font-sans text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">
                Subtotal ({count} {count === 1 ? "piece" : "pieces"})
              </dt>
              <dd>
                <PriceTag amountInr={subtotal} size="sm" />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-right text-xs text-ink/85">
                Free — ships within India in 5–7 days
              </dd>
            </div>
          </dl>

          <form
            className="mt-6 flex items-center gap-2"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="text"
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
              placeholder="Promo code"
              aria-label="Promo code"
              className="min-w-0 flex-1 border border-black/10 bg-cream px-4 py-2.5 font-sans text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none"
            />
            <Button variant="ghost" size="md" type="submit">
              Apply
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-6">
            <span className="font-sans text-sm font-medium text-ink">Total</span>
            <PriceTag amountInr={subtotal} size="lg" />
          </div>

          <div className="mt-6">
            <Button variant="primary" size="lg" href="/checkout" className="w-full">
              Proceed to checkout
            </Button>
          </div>

          <p className="mt-4 text-center font-sans text-xs text-muted">
            Hand-set in Jaipur · Insured delivery · 7-day returns
          </p>
        </div>
      </aside>
    </div>
  );
}
