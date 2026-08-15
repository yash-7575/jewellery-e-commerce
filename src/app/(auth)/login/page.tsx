"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button } from "@/components";
import { signIn } from "@/lib/auth";
import { INPUT_CLASSES, formatAuthError } from "../shared";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

interface LoginErrors {
  email?: string;
  password?: string;
  form?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const redirectAfterSignIn = (): string => {
    const raw = searchParams.get("redirect");
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/account";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: LoginErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Please enter a valid email.";
    if (!password) next.password = "Please enter your password.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push(redirectAfterSignIn());
    } catch (error) {
      setErrors({ form: formatAuthError(error) });
      setSubmitting(false);
    }
  };

  return (
    <div>
      <p className="eyebrow">AARANYA · Maison Jaipur</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">
        Welcome <span className="font-serif-i">back</span>
      </h1>
      <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
        Sign in to view your orders, saved pieces and details.
      </p>

      {errors.form && (
        <p className="mt-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
          {errors.form}
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
              setErrors((current) => ({ ...current, email: "", form: "" }));
            }}
            className={`mt-2 ${INPUT_CLASSES}`}
          />
          {errors.email && (
            <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.email}</p>
          )}
        </label>

        <label className="block">
          <span className="eyebrow">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: "", form: "" }));
            }}
            className={`mt-2 ${INPUT_CLASSES}`}
          />
          {errors.password && (
            <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.password}</p>
          )}
        </label>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="font-sans text-xs font-medium text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Forgot password?
          </Link>
        </div>

        <Button variant="primary" size="lg" type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 font-sans text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="font-sans text-sm text-muted">Preparing sign in&hellip;</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}