"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <form
      className="mt-6 flex flex-wrap items-center gap-3 max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        setSubscribed(true);
      }}
    >
      <input
        type="email"
        required
        placeholder="Your email address"
        className="flex-1 min-w-[220px] px-5 py-3 rounded-full text-sm text-ink bg-cream/95 placeholder:text-muted focus:outline-none"
      />
      <button type="submit" className="btn-pill">
        {subscribed ? "Thank you ✓" : "Subscribe"}
      </button>
    </form>
  );
}