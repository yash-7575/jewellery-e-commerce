"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, EmptyState } from "@/components";
import { fetchWithAuth, getJsonAuth } from "@/lib/auth";

interface ProfileResponse {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  isAdmin?: boolean;
  defaultAddressId?: string;
  createdAt?: string;
}

type State = "loading" | "ready" | "error";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const INPUT_CLASSES =
  "w-full border border-black/10 bg-cream px-4 py-3 font-sans text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none";

export default function ProfilePage() {
  const [state, setState] = useState<State>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const profile = await getJsonAuth<ProfileResponse>("/v1/me");
        if (cancelled) return;
        setEmail(profile.email);
        setName(profile.name ?? "");
        setPhone(profile.phone ?? "");
        setState("ready");
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "We could not load your profile.",
          );
          setState("error");
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: { name?: string; phone?: string } = {};
    if (!name.trim()) next.name = "Name is required.";
    if (phone.trim() && !/^[+\d][\d\s.-]{5,}$/.test(phone.trim()))
      next.phone = "Enter a valid phone number.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetchWithAuth(`${API_BASE}/v1/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!response.ok) {
        throw new Error(`AARANYA API /v1/me responded ${response.status}`);
      }
      setMessage("Your details have been updated.");
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Could not update your details.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/2 bg-creamDark" />
        <div className="h-64 bg-creamDark" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title="Profile unavailable"
        body={errorMessage ?? "We could not load your profile. Please try again."}
        cta={{ label: "Back to account", href: "/account" }}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <div>
        <h1 className="font-serif text-4xl text-ink">
          Your <span className="font-serif-i">profile</span>
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          Details shown to the atelier when you place an order. Email changes go
          through sign-in only.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="mt-8 border border-black/5 bg-creamLight p-8">
        {message && (
          <p className="mb-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
            {message}
          </p>
        )}
        {errors.form && (
          <p className="mb-6 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
            {errors.form}
          </p>
        )}

        <div className="space-y-5">
          <label className="block">
            <span className="eyebrow">Email</span>
            <input
              type="email"
              value={email}
              readOnly
              className={`mt-2 ${INPUT_CLASSES} cursor-not-allowed opacity-70`}
            />
            <p className="mt-1 font-sans text-[11px] text-muted">
              Managed by AARANYA sign-in — to change it, reset via email.
            </p>
          </label>

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
                setMessage(null);
              }}
              className={`mt-2 ${INPUT_CLASSES}`}
            />
            {errors.name && (
              <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.name}</p>
            )}
          </label>

          <label className="block">
            <span className="eyebrow">Phone</span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+91 98000 00000"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setErrors((current) => ({ ...current, phone: "", form: "" }));
                setMessage(null);
              }}
              className={`mt-2 ${INPUT_CLASSES}`}
            />
            {errors.phone && (
              <p className="mt-1 font-sans text-xs font-medium text-forest">{errors.phone}</p>
            )}
          </label>
        </div>

        <div className="mt-8">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}