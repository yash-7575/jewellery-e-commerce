"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, PriceTag } from "@/components";
import type { Order } from "@/components/types";
import { getAccessToken, getOrderById } from "@/lib/api";

export default function OrderClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!getAccessToken()) {
          setErrorMessage("Please sign in to view this order.");
          setState("error");
          return;
        }
        const data = await getOrderById(orderId);
        if (!cancelled) {
          setOrder(data);
          setState("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "We could not load this order.",
          );
          setState("error");
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-[1400px] animate-pulse space-y-6 px-6 py-16 md:px-8">
        <div className="h-10 w-1/2 bg-creamDark" />
        <div className="h-4 w-1/3 bg-creamDark" />
        <div className="h-64 bg-creamDark" />
      </div>
    );
  }

  if (state === "error" || !order) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center md:px-8">
        <h1 className="font-serif text-4xl text-ink">
          Order <span className="font-serif-i">unavailable</span>
        </h1>
        <p className="mt-4 font-sans text-sm leading-relaxed text-muted">
          {errorMessage ?? "We could not find this order."}
        </p>
        <div className="mt-8">
          <Button variant="primary" href="/shop">
            Back to shop
          </Button>
        </div>
      </div>
    );
  }

  const total = order.amounts?.total ?? order.total ?? 0;
  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-16 md:px-8">
      <div className="text-center">
        <p className="eyebrow">AARANYA · Maison Jaipur</p>
        <h1 className="mt-4 font-serif text-4xl text-ink">
          Order confirmed <span aria-hidden>🎉</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-relaxed text-muted">
          Thank you — every stone in your order will be set by hand in our Jaipur
          atelier before it is sent to you.
        </p>
        <p className="mt-4 font-sans text-xs uppercase tracking-widest text-muted">
          Order id · <span className="text-ink">{order.orderId}</span>
        </p>
      </div>

      <div className="mt-12 border border-black/5 bg-creamLight">
        <div className="border-b border-black/5 p-6">
          <h2 className="eyebrow">Your pieces</h2>
        </div>
        <ul className="divide-y divide-black/5 px-6">
          {(order.items ?? []).map((item) => (
            <li key={item.productId} className="flex items-center gap-6 py-5">
              <span className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-sm bg-cream">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-base text-ink">{item.name}</span>
                <span className="block font-sans text-xs text-muted">Qty {item.qty}</span>
              </span>
              <PriceTag amountInr={item.lineTotal} size="sm" />
            </li>
          ))}
          {(order.items ?? []).length === 0 && (
            <li className="py-6 font-sans text-sm text-muted">
              {order.itemCount} piece{order.itemCount === 1 ? "" : "s"}
            </li>
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-black/5 p-6">
          <span className="font-sans text-sm font-medium text-ink">Total paid</span>
          <PriceTag amountInr={total} size="lg" />
        </div>
      </div>

      {address && (
        <div className="mt-8 border border-black/5 bg-creamLight p-6">
          <h2 className="eyebrow">Delivering to</h2>
          <p className="mt-3 font-sans text-sm font-medium text-ink">{address.recipient}</p>
          <p className="mt-1 font-sans text-sm text-muted">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </p>
          <p className="font-sans text-sm text-muted">
            {address.city}, {address.state} {address.pincode} · {address.country}
          </p>
          <p className="mt-1 font-sans text-xs text-muted">{address.phone}</p>
        </div>
      )}

      <p className="mt-8 text-center font-sans text-xs text-muted">
        Free insured shipping · Hand-set in Jaipur, delivered within India in 5–7 days
      </p>

      <div className="mt-10 text-center">
        <Button variant="primary" size="lg" href="/shop">
          Back to shop
        </Button>
      </div>
    </div>
  );
}
