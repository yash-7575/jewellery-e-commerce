"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, EmptyState, PriceTag } from "@/components";
import { getJsonAuth } from "@/lib/auth";
import type { OrderStatus } from "@/components/types";

interface OrderSummary {
  orderId: string;
  status: OrderStatus;
  currency?: string;
  total?: number;
  itemCount?: number;
  createdAt?: string;
}

interface OrdersResponse {
  items?: OrderSummary[];
  count?: number;
}

type State = "loading" | "ready" | "error";

const STATUS_BADGES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-cream text-forest",
  PAID: "bg-forest text-cream",
  PROCESSING: "bg-forest text-cream",
  SHIPPED: "bg-forest text-cream",
  DELIVERED: "bg-forest text-cream",
  CANCELLED: "bg-black/10 text-muted",
  REFUNDED: "bg-black/10 text-muted",
};

const formatDate = (value?: string): string => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function OrdersPage() {
  const [state, setState] = useState<State>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getJsonAuth<OrdersResponse>("/v1/orders?limit=20");
        if (!cancelled) {
          setOrders(data.items ?? []);
          setState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "We could not load your orders.",
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
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-24 bg-creamDark" />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title="Orders unavailable"
        body={errorMessage ?? "We could not load your orders. Please try again."}
        cta={{ label: "Back to account", href: "/account" }}
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        body="Every order begins at the atelier. Explore the collection and make one yours."
        cta={{ label: "Explore the collection", href: "/shop" }}
      />
    );
  }

  return (
    <div>
      <h1 className="font-serif text-4xl text-ink">
        Your <span className="font-serif-i">orders</span>
      </h1>

      <ul className="mt-8 divide-y divide-black/5 border-y border-black/5">
        {orders.map((order) => (
          <li key={order.orderId}>
            <Link
              href={`/order/${order.orderId}`}
              className="flex flex-wrap items-center justify-between gap-4 py-6 transition-opacity hover:opacity-70"
            >
              <div className="min-w-0">
                <p className="font-serif text-lg text-ink">{order.orderId}</p>
                <p className="mt-0.5 font-sans text-xs text-muted">
                  Placed {formatDate(order.createdAt)} · {order.itemCount} piece
                  {order.itemCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <span
                  className={`inline-flex px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-widest ${STATUS_BADGES[order.status]}`}
                >
                  {order.status.replace("_", " ").toLowerCase()}
                </span>
                <PriceTag amountInr={order.total ?? 0} size="sm" />
                <span aria-hidden className="font-sans text-muted">
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button variant="ghost" href="/shop">
          Continue shopping
        </Button>
      </div>
    </div>
  );
}