import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader cartCount={0} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}