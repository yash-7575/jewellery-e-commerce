"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PasswordResetForm from "../PasswordResetForm";

function ResetPassword() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? undefined;
  return <PasswordResetForm initialEmail={email ?? ""} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <p className="font-sans text-sm text-muted">Preparing reset&hellip;</p>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}