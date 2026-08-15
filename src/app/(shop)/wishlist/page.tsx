import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = {
  title: "Wishlist — AARANYA",
  description: "The pieces you have loved from the AARANYA atelier.",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Wishlist" },
        ]}
      />
      <h1 className="mt-6 text-center font-serif text-4xl text-forest">
        Your <span className="font-serif-i">wishlist</span>
      </h1>
      <WishlistClient />
    </div>
  );
}