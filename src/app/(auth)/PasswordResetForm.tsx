"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components";
import { confirmForgotPassword } from "@/lib/auth";
import { INPUT_CLASSES, formatAuthError } from "./shared";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function PasswordResetForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Please enter a valid email.";
    if (!code.trim()) next.code = "Please enter the code from your email.";
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      next.password =
        "At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      await confirmForgotPassword(email, code, password);
      router.push("/login");
    } catch (error) {
      setErrors({ form: formatAuthError(error) });
      setSubmitting(false);
    }
  };

  return (
    <div>
      <p className="eyebrow">Reset your password</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">
        Set a new <span className="font-serif-i">password</span>
      </h1>
      <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
        Enter the code sent to your email along with your new password.
      </p>

      {errors.form && (
        <p className="mt-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
          {errors.form}
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        {!initialEmail && (
          <label className="block">
            <span className="eyebrow">Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="ananya@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: "", form: "" }));
              }}
              className={`mt-2 ${INPUT_CLASSES}`}
            />
            {errors.email && (
              <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.email}</p>
            )}
          </label>
        )}

        <label className="block">
          <span className="eyebrow">Confirmation code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setErrors((current) => ({ ...current, code: "", form: "" }));
            }}
            className={`mt-2 ${INPUT_CLASSES}`}
          />
          {errors.code && (
            <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.code}</p>
          )}
        </label>

        <label className="block">
          <span className="eyebrow">New password</span>
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: "", form: "" }));
            }}
            className={`mt-2 ${INPUT_CLASSES}`}
          />
          <span className="mt-1 flex items-center gap-2 font-sans text-[11px] text-muted">
            <button
              type="button"
              onClick={() => setShow((current) => !current)}
              className="font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              {show ? "Hide" : "Show"} password
            </button>
          </span>
          {errors.password && (
            <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.password}</p>
          )}
        </label>

        <Button variant="primary" size="lg" type="submit" disabled={submitting} className="w-full">
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <p className="mt-6 font-sans text-sm text-muted">
        Changed your mind?{" "}
        <Link href="/login" className="text-forest underline underline-offset-4 hover:opacity-70">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}