import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs, ListSkeleton } from "@/components";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search — AARANYA",
  description: "Search the AARANYA collection — hand-set diamonds & 22K gold from Jaipur.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Search" },
        ]}
      />
      <h1 className="mt-6 text-center font-serif text-4xl text-forest">Search</h1>
      <Suspense fallback={<ListSkeleton count={6} />}>
        <SearchClient />
      </Suspense>
    </div>
  );
}