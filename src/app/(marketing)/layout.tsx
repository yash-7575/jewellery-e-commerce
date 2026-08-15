import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components";

export const metadata: Metadata = {
  title: {
    template: "%s — AARANYA",
    default: "AARANYA — Hand-set diamonds & 22K gold",
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SiteHeader cartCount={0} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}