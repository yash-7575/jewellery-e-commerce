import { ListSkeleton } from "@/components";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <div className="mb-8">
        <div className="h-3 w-24 animate-pulse bg-creamDark" />
        <div className="mt-2 h-8 w-48 animate-pulse bg-creamDark" />
      </div>
      <ListSkeleton count={8} />
    </div>
  );
}