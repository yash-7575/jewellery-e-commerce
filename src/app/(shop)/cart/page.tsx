import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Your Bag — AARANYA",
  description: "Your selected pieces from the AARANYA atelier.",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Cart" },
        ]}
      />
      <h1 className="mt-6 font-serif text-4xl text-ink">
        Your <span className="font-serif-i">bag</span>
      </h1>
      <CartClient />
    </div>
  );
}
