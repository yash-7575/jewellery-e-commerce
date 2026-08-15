import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s — AARANYA",
    default: "AARANYA — Hand-set diamonds & 22K gold",
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="pt-10 text-center">
        <Link
          href="/"
          className="font-serif text-2xl font-medium tracking-[0.35em] text-forest transition-opacity hover:opacity-70"
        >
          AARANYA
        </Link>
      </header>

      <main className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md border border-forest/20 bg-creamLight px-8 py-10 md:px-10">
          {children}
        </div>
      </main>

      <footer className="pb-8 text-center font-sans text-xs text-muted">
        Founded in Jaipur in 1908 — every stone set by hand.
      </footer>
    </div>
  );
}