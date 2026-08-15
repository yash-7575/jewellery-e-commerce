export default function AuthLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-md animate-pulse space-y-4 border border-forest/20 bg-creamLight px-8 py-12 md:px-10">
        <div className="mx-auto h-8 w-40 bg-creamDark" />
        <div className="h-10 w-full bg-creamDark" />
        <div className="h-10 w-full bg-creamDark" />
        <div className="h-10 w-32 bg-creamDark" />
      </div>
    </div>
  );
}