"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components";
import { confirmSignUp, resendConfirmationCode, signUp } from "@/lib/auth";
import { INPUT_CLASSES, formatAuthError } from "../shared";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type Step = "form" | "verify";

interface SignUpErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

const PASSWORD_HINT =
  "At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.";

export default function SignUpPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const submitDetails = async (event: FormEvent) => {
    event.preventDefault();
    const next: SignUpErrors = {};
    if (!name.trim()) next.name = "Please tell us your name.";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Please enter a valid email.";
    if (!PASSWORD_PATTERN(password)) next.password = PASSWORD_HINT;
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      await signUp({ email, password, name });
      setStep("verify");
    } catch (error) {
      setErrors({ form: formatAuthError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setErrors({ form: "Please enter the confirmation code." });
      return;
    }
    setSubmitting(true);
    try {
      await confirmSignUp(email, code);
      router.push("/login");
    } catch (error) {
      setErrors({ form: formatAuthError(error) });
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setResent(false);
    try {
      await resendConfirmationCode(email);
      setResent(true);
    } catch (error) {
      setErrors({ form: formatAuthError(error) });
    } finally {
      setResending(false);
    }
  };

  if (step === "verify") {
    return (
      <div>
        <p className="eyebrow">Almost there</p>
        <h1 className="mt-3 font-serif text-3xl text-ink">
          Check your <span className="font-serif-i">inbox</span>
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
          We&apos;ve sent a confirmation code to <span className="text-ink">{email}</span>.
          Enter it below to complete sign up.
        </p>

        {errors.form && (
          <p className="mt-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
            {errors.form}
          </p>
        )}
        {resent && (
          <p className="mt-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
            A fresh code is on its way to {email}.
          </p>
        )}

        <form onSubmit={confirmCode} noValidate className="mt-8 space-y-5">
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
                setErrors((current) => ({ ...current, form: "" }));
              }}
              className={`mt-2 ${INPUT_CLASSES}`}
            />
          </label>
          <Button variant="primary" size="lg" type="submit" disabled={submitting} className="w-full">
            {submitting ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        <p className="mt-6 font-sans text-sm text-muted">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="text-forest underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {resending ? "Sending…" : "Resend it"}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">AARANYA · Maison Jaipur</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">
        Join the <span className="font-serif-i">atelier</span>
      </h1>
      <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
        Create an account to save pieces, track orders and be among the first to
        hear of new collections.
      </p>

      {errors.form && (
        <p className="mt-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
          {errors.form}
        </p>
      )}

      <form onSubmit={submitDetails} noValidate className="mt-8 space-y-5">
        <label className="block">
          <span className="eyebrow">Name</span>
          <input
            type="text"
            autoComplete="name"
            placeholder="Ananya Sharma"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: "", form: "" }));
            }}
            className={`mt-2 ${INPUT_CLASSES}`}
          />
          {errors.name && (
            <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.name}</p>
          )}
        </label>

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
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: "", form: "" }));
            }}
            className={`mt-2 ${INPUT_CLASSES}`}
          />
          <span className="mt-1 flex items-center justify-between gap-2 font-sans text-[11px] text-muted">
            <span>{PASSWORD_HINT}</span>
            <button
              type="button"
              onClick={() => setShow((current) => !current)}
              className="shrink-0 font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              {show ? "Hide" : "Show"}
            </button>
          </span>
          {errors.password && (
            <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.password}</p>
          )}
        </label>

        <Button variant="primary" size="lg" type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 font-sans text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-forest underline underline-offset-4 transition-opacity hover:opacity-70">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function PASSWORD_PATTERN(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}