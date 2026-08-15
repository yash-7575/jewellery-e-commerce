"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, PriceTag } from "@/components";
import { getJsonAuth } from "@/lib/auth";

interface ProfileResponse {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  isAdmin?: boolean;
  defaultAddressId?: string;
  createdAt?: string;
}

interface OrderSummary {
  orderId: string;
  status: string;
  currency?: string;
  total?: number;
  itemCount?: number;
  createdAt?: string;
}

interface OrdersResponse {
  items?: OrderSummary[];
  count?: number;
}

interface AddressListResponse {
  items?: unknown[];
  count?: number;
}

type State = "loading" | "ready" | "error";

const formatDate = (value?: string): string => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function AccountOverviewPage() {
  const [state, setState] = useState<State>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [recentOrder, setRecentOrder] = useState<OrderSummary | null>(null);
  const [addressCount, setAddressCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [profileData, ordersData, addressesData] = await Promise.all([
          getJsonAuth<ProfileResponse>("/v1/me"),
          getJsonAuth<OrdersResponse>("/v1/orders?limit=1"),
          getJsonAuth<AddressListResponse>("/v1/me/addresses"),
        ]);
        if (cancelled) return;
        setProfile(profileData);
        setRecentOrder(ordersData.items?.[0] ?? null);
        setAddressCount(addressesData.count ?? addressesData.items?.length ?? 0);
        setState("ready");
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "We could not load your account.",
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
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/2 bg-creamDark" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-48 bg-creamDark" />
          <div className="h-48 bg-creamDark" />
          <div className="h-48 bg-creamDark" />
        </div>
      </div>
    );
  }

  if (state === "error" || !profile) {
    return (
      <div className="border border-black/5 bg-creamLight p-10 text-center">
        <h1 className="font-serif text-3xl text-ink">
          Account <span className="font-serif-i">unavailable</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-muted">
          {errorMessage ?? "We could not load your account details. Please try again."}
        </p>
        <div className="mt-6">
          <Button variant="primary" href="/shop">
            Back to shop
          </Button>
        </div>
      </div>
    );
  }

  const firstName = profile.name.trim().split(/\s+/)[0] || "welcome";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-4xl text-ink">
          Welcome, <span className="font-serif-i">{firstName}</span>
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          {profile.email}
          {profile.phone ? ` · ${profile.phone}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <section className="border border-black/5 bg-creamLight p-8">
          <h2 className="eyebrow">Recent order</h2>
          {recentOrder ? (
            <div className="mt-4">
              <p className="font-sans text-xs uppercase tracking-widest text-muted">
                {recentOrder.orderId}
              </p>
              <p className="mt-1 font-sans text-xs text-muted">
                {formatDate(recentOrder.createdAt)} · {recentOrder.itemCount} piece
                {recentOrder.itemCount === 1 ? "" : "s"}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                <span className="font-sans text-xs uppercase tracking-widest text-muted">
                  {recentOrder.status}
                </span>
                <PriceTag amountInr={recentOrder.total ?? 0} size="sm" />
              </div>
              <Link
                href={`/order/${recentOrder.orderId}`}
                className="mt-4 inline-block font-sans text-xs font-medium text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                View order →
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <p className="font-sans text-sm text-muted">
                No orders yet — the atelier is waiting.
              </p>
              <div className="mt-4">
                <Button variant="primary" size="sm" href="/shop">
                  Explore the collection
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="border border-black/5 bg-creamLight p-8">
          <h2 className="eyebrow">Addresses</h2>
          <p className="mt-4 font-serif text-4xl text-ink">{addressCount}</p>
          <p className="mt-1 font-sans text-sm text-muted">
            saved address{addressCount === 1 ? "" : "es"}
          </p>
          <Link
            href="/account/addresses"
            className="mt-4 inline-block font-sans text-xs font-medium text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Manage addresses →
          </Link>
        </section>

        <section className="border border-black/5 bg-creamLight p-8">
          <h2 className="eyebrow">Profile</h2>
          <p className="mt-4 font-sans text-sm font-medium text-ink">{profile.name}</p>
          <p className="mt-1 font-sans text-sm text-muted">{profile.email}</p>
          <p className="mt-1 font-sans text-sm text-muted">{profile.phone || "No phone on file"}</p>
          <Link
            href="/account/profile"
            className="mt-4 inline-block font-sans text-xs font-medium text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Edit profile →
          </Link>
        </section>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-4 border border-black/5 bg-creamLight p-8">
        <div>
          <h2 className="font-serif text-2xl text-ink">
            Your saved <span className="font-serif-i">pieces</span>
          </h2>
          <p className="mt-1 font-sans text-sm text-muted">
            The pieces you have loved, gathered in one place.
          </p>
        </div>
        <Button variant="ghost" href="/wishlist">
          View wishlist
        </Button>
      </section>
    </div>
  );
}