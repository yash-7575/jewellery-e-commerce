export type Metal = "22k gold" | "silver" | "rose gold" | "platinum";

export type Gemstone = "diamond" | "ruby" | "emerald" | "polki" | "none";

export type SortKey = "newest" | "price-asc" | "price-desc" | "popularity";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  metal: Metal;
  gemstone: Gemstone;
  weightGrams: number;
  priceInr: number;
  compareAtInr?: number;
  stock: number;
  shortDescription: string;
  longDescription: string;
  images: string[];
  createdAt: string;
  popularity: number;
  attributes?: Record<string, unknown>;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  productCount?: number;
  displayOrder?: number;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  imageUrl: string;
  metal: Metal;
  gemstone: Gemstone;
  inStock: boolean;
}

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  addedAt: string;
  inStock: boolean;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface Order {
  orderId: string;
  status: OrderStatus;
  currency: string;
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  shippingAddress?: Address;
  amounts?: {
    subtotal: number;
    shipping: number;
    discount: number;
    tax: number;
    total: number;
  };
}

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  imageUrl: string;
}

export interface Review {
  reviewId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Address {
  addressId: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  defaultAddressId?: string;
  createdAt: string;
}

export interface FilterState {
  categories: string[];
  metals: Metal[];
  gemstones: Gemstone[];
  minPrice?: number;
  maxPrice?: number;
}