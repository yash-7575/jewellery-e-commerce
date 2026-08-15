import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceInr: number;
  image: string;
  quantity: number;
  metal?: string;
  size?: string;
}

export const CART_STORAGE_KEY = "aaranya_cart";

const MAX_QTY_PER_LINE = 10;

const isBrowser = () => typeof window !== "undefined";

const isCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as CartItem;
  return (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.priceInr === "number" &&
    typeof item.image === "string" &&
    typeof item.quantity === "number"
  );
};

export function getGuestCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function saveGuestCart(items: CartItem[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    return;
  }
}

const sameLine = (a: CartItem, b: CartItem) =>
  a.productId === b.productId && (a.metal ?? "") === (b.metal ?? "") && (a.size ?? "") === (b.size ?? "");

export function addToCart(item: CartItem): CartItem[] {
  const items = getGuestCart();
  const existing = items.find((entry) => sameLine(entry, item));
  const next = existing
    ? items.map((entry) =>
        entry === existing
          ? { ...entry, quantity: Math.min(entry.quantity + item.quantity, MAX_QTY_PER_LINE) }
          : entry,
      )
    : [...items, { ...item, quantity: Math.min(Math.max(item.quantity, 1), MAX_QTY_PER_LINE) }];
  saveGuestCart(next);
  return next;
}

export function removeFromCart(productId: string): CartItem[] {
  const next = getGuestCart().filter((item) => item.productId !== productId);
  saveGuestCart(next);
  return next;
}

export function setQuantity(productId: string, qty: number): CartItem[] {
  const clamped = Math.min(Math.max(qty, 1), MAX_QTY_PER_LINE);
  const next = getGuestCart().map((item) =>
    item.productId === productId ? { ...item, quantity: clamped } : item,
  );
  saveGuestCart(next);
  return next;
}

export function clearCart(): void {
  saveGuestCart([]);
}

export function subtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceInr * item.quantity, 0);
}

export interface UseCartResult {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(getGuestCart());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === CART_STORAGE_KEY) {
        setItems(getGuestCart());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: CartItem) => setItems(addToCart(item)), []);
  const remove = useCallback((productId: string) => setItems(removeFromCart(productId)), []);
  const setQty = useCallback(
    (productId: string, qty: number) => setItems(setQuantity(productId, qty)),
    [],
  );
  const clear = useCallback(() => {
    clearCart();
    setItems([]);
  }, []);

  return {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: subtotal(items),
    ready,
    addToCart: add,
    removeFromCart: remove,
    setQuantity: setQty,
    clearCart: clear,
  };
}
