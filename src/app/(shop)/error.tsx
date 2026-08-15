"use client";

import { useCallback, useState } from "react";
import { Button, EmptyState } from "@/components";

const RETRY_CLASS =
  "inline-flex items-center justify-center font-sans font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-forest text-cream hover:bg-forestDark px-5 py-2.5 text-sm";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  const onReset = useCallback(() => {
    setRetrying(true);
    reset();
  }, [reset]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <EmptyState
        title="The shop is briefly closed"
        body="We could not load the collection. It is likely a network hiccup on our side. Please try again."
      />
      <div className="-mt-6 flex items-center gap-3">
        <button type="button" onClick={onReset} disabled={retrying} className={RETRY_CLASS}>
          {retrying ? "Trying again…" : "Try again"}
        </button>
        <Button variant="ghost" href="/shop">
          Back to shop
        </Button>
      </div>
    </main>
  );
}