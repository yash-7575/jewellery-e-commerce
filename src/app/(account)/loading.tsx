export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <div className="animate-pulse">
        <div className="h-3 w-24 bg-creamDark" />
        <div className="mt-2 h-7 w-64 bg-creamDark" />
        <div className="mt-6 flex gap-x-8 gap-y-2 border-b border-black/5 pb-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-4 w-16 bg-creamDark" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-5 w-full bg-creamDark" />
          <div className="h-5 w-full bg-creamDark" />
          <div className="h-5 w-2/3 bg-creamDark" />
        </div>
      </div>
    </div>
  );
}