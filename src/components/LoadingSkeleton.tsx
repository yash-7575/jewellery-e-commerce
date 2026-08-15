export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-[4/5] bg-creamDark" />
      <div className="h-4 w-3/4 bg-creamDark" />
      <div className="h-3 w-1/2 bg-creamDark" />
    </div>
  );
}

export function PDPSkeleton() {
  return (
    <div className="animate-pulse mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-8 py-12 md:grid-cols-2">
      <div className="aspect-[4/5] bg-creamDark" />
      <div className="space-y-4">
        <div className="h-8 w-2/3 bg-creamDark" />
        <div className="h-4 w-1/3 bg-creamDark" />
        <div className="h-6 w-1/2 bg-creamDark" />
        <div className="h-4 w-full bg-creamDark" />
        <div className="h-4 w-full bg-creamDark" />
        <div className="h-4 w-5/6 bg-creamDark" />
        <div className="h-12 w-40 bg-creamDark" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}