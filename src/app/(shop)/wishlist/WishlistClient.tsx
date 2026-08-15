"use client";

import { useEffect, useState } from "react";
import { EmptyState, ListSkeleton, ProductCard } from "@/components";
import type { Product } from "@/components/types";
import { getJsonAuth } from "@/lib/auth";

interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency?: string;
  imageUrl: string;
  addedAt?: string;
  inStock?: boolean;
}

interface WishlistResponse {
  items?: WishlistItem[];
  count?: number;
}

type State = "loading" | "ready" | "error";

const toProduct = (item: WishlistItem): Product => ({
  id: item.productId,
  slug: item.slug,
  name: item.name,
  category: "",
  metal: "22k gold",
  gemstone: "none",
  weightGrams: 0,
  priceInr: item.price,
  stock: item.inStock === false ? 0 : 5,
  shortDescription: "",
  longDescription: "",
  images: item.imageUrl ? [item.imageUrl] : [],
  createdAt: item.addedAt ?? new Date().toISOString(),
  popularity: 0,
});

export default function WishlistClient() {
  const [state, setState] = useState<State>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getJsonAuth<WishlistResponse>("/v1/wishlist");
        if (!cancelled) {
          setItems(data.items ?? []);
          setState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "We could not load your wishlist.",
          );
          setState("error");
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="mt-10">
        <ListSkeleton count={6} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title="Wishlist unavailable"
        body={errorMessage ?? "We could not load your wishlist. Please try again."}
        cta={{ label: "Back to shop", href: "/shop" }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        body="Save pieces as you wander the collection, then return to them here."
        cta={{ label: "Explore the collection", href: "/shop" }}
      />
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ProductCard key={item.productId} product={toProduct(item)} />
      ))}
    </div>
  );
}