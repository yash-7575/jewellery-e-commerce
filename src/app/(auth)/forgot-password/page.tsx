"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components";
import { forgotPassword } from "@/lib/auth";
import { INPUT_CLASSES, formatAuthError } from "../shared";
import PasswordResetForm from "../PasswordResetForm";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string>("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSentTo(email);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return <PasswordResetForm initialEmail={sentTo} />;
  }

  return (
    <div>
      <p className="eyebrow">Password help</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">
        Forgot your <span className="font-serif-i">password</span>
      </h1>
      <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
        Enter the email tied to your account and we will send you a code to set
        a new password.
      </p>

      {error && (
        <p className="mt-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
          {error}
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <label className="block">
          <span className="eyebrow">Email</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="ananya@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            className={`mt-2 ${INPUT_CLASSES}`}
          />
        </label>

        <Button variant="primary" size="lg" type="submit" disabled={submitting} className="w-full">
          {submitting ? "Sending code…" : "Send reset code"}
        </Button>
      </form>

      <p className="mt-6 font-sans text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}