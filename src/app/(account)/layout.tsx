"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components";
import { useAuth } from "@/lib/auth";

const TABS = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Profile", href: "/account/profile" },
  { label: "Wishlist", href: "/wishlist" },
];

const isActiveTab = (pathname: string, href: string): boolean =>
  href === "/account" ? pathname === "/account" : pathname.startsWith(href);

export default function AccountLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/login?redirect=${encodeURIComponent(pathname.startsWith("/") ? pathname : "/account")}`,
      );
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <>
        <SiteHeader />
        <div className="mx-auto flex max-w-[1400px] items-center justify-center px-6 py-32 md:px-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            <p className="mt-4 font-sans text-xs uppercase tracking-widest text-muted">
              Opening your account&hellip;
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">My Account</p>
            <p className="mt-1 font-serif text-2xl text-ink">
              {user.name || "Welcome"} <span className="font-serif-i">.</span>{" "}
              <span className="font-serif not-italic text-muted">{user.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="font-sans text-xs font-medium text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Sign out
          </button>
        </div>

        <nav className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-black/5 pb-4 font-sans text-xs uppercase tracking-widest">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                isActiveTab(pathname, tab.href)
                  ? "text-forest"
                  : "text-muted transition-opacity hover:opacity-70"
              }
              aria-current={isActiveTab(pathname, tab.href) ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <main className="mt-8">{children}</main>
      </div>
      <SiteFooter />
    </>
  );
}