import { Button, EmptyState } from "@/components";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
      <EmptyState
        title="This page has left the atelier"
        body="We could not find the page you were looking for. It may have been moved, renamed, or never existed."
        cta={{ label: "Browse the collection", href: "/shop" }}
      />
      <div className="-mt-6 flex items-center gap-3">
        <Button variant="ghost" href="/">
          Back home
        </Button>
      </div>
    </main>
  );
}