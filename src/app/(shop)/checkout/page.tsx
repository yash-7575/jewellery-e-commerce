import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — AARANYA",
  description: "Complete your order from the AARANYA atelier.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <h1 className="mt-6 font-serif text-4xl text-ink">
        Check<span className="font-serif-i">out</span>
      </h1>
      <CheckoutClient />
    </div>
  );
}
