"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, EmptyState } from "@/components";
import type { Address } from "@/components/types";
import { fetchWithAuth, getJsonAuth } from "@/lib/auth";

interface AddressListResponse {
  items?: Address[];
  count?: number;
}

type State = "loading" | "ready" | "error";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const INPUT_CLASSES =
  "w-full border border-black/10 bg-cream px-4 py-3 font-sans text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none";

interface AddressFormState {
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormState = {
  label: "Home",
  recipient: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "IN",
  isDefault: false,
};

const parseError = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: { message?: string } }).error?.message === "string"
    ) {
      return (body as { error: { message: string } }).error.message;
    }
  } catch {
    // fall through to status text
  }
  return response.status === 409
    ? "Operation failed. This address may be your default — set a new default first."
    : `Request failed (${response.status}).`;
};

export default function AddressesPage() {
  const [state, setState] = useState<State>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddressFormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await getJsonAuth<AddressListResponse>("/v1/me/addresses");
      setAddresses(data.items ?? []);
      setState("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We could not load your addresses.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key: keyof AddressFormState) => (value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
    setSavingError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof AddressFormState, string>> = {};
    if (!form.recipient.trim()) next.recipient = "Recipient name is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.line1.trim()) next.line1 = "Address line 1 is required.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.state.trim()) next.state = "State is required.";
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = "Enter a 6-digit pincode.";
    setFormErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    setSavingError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE}/v1/me/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error(await parseError(response));
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : "Could not save the address.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (addressId: string) => {
    setDeletingId(addressId);
    setSavingError(null);
    try {
      const response = await fetchWithAuth(
        `${API_BASE}/v1/me/addresses/${encodeURIComponent(addressId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(await parseError(response));
      }
      setAddresses((current) => current.filter((address) => address.addressId !== addressId));
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : "Could not remove the address.");
    } finally {
      setDeletingId(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/2 bg-creamDark" />
        <div className="h-48 bg-creamDark" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title="Addresses unavailable"
        body={errorMessage ?? "We could not load your addresses. Please try again."}
        cta={{ label: "Back to account", href: "/account" }}
      />
    );
  }

  const addressCount = addresses.length;

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_420px]">
      <div>
        <h1 className="font-serif text-4xl text-ink">
          Saved <span className="font-serif-i">addresses</span>
        </h1>

        {savingError && (
          <p className="mt-4 border border-forest/30 bg-cream p-4 font-sans text-sm text-forest">
            {savingError}
          </p>
        )}

        {addressCount === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No addresses yet"
              body="Add a delivery address so the atelier knows where to send your pieces."
            />
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {addresses.map((address) => (
              <li key={address.addressId} className="border border-black/5 bg-creamLight p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">{address.label}</p>
                  {address.isDefault && (
                    <span className="font-sans text-[10px] font-medium uppercase tracking-widest text-forest">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-3 font-sans text-sm font-medium text-ink">{address.recipient}</p>
                <p className="mt-1 font-sans text-sm text-muted">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </p>
                <p className="font-sans text-sm text-muted">
                  {address.city}, {address.state} {address.pincode} · {address.country}
                </p>
                <p className="mt-1 font-sans text-xs text-muted">{address.phone}</p>
                <button
                  type="button"
                  onClick={() => remove(address.addressId)}
                  disabled={deletingId === address.addressId}
                  className="mt-5 font-sans text-xs font-medium text-forest underline underline-offset-4 transition-opacity hover:opacity-70 disabled:opacity-50"
                >
                  {deletingId === address.addressId ? "Removing…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={submit} noValidate className="border border-black/5 bg-creamLight p-8">
        <h2 className="font-serif text-2xl text-ink">
          Add a new <span className="font-serif-i">address</span>
        </h2>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow">Label</span>
              <input
                type="text"
                placeholder="Home"
                value={form.label}
                onChange={(event) => update("label")(event.target.value)}
                className={`mt-2 ${INPUT_CLASSES}`}
              />
            </label>
            <label className="block">
              <span className="eyebrow">Recipient</span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Ananya Sharma"
                value={form.recipient}
                onChange={(event) => update("recipient")(event.target.value)}
                className={`mt-2 ${INPUT_CLASSES}`}
              />
              {formErrors.recipient && (
                <p className="mt-1 font-sans text-xs font-medium text-forest">
                  {formErrors.recipient}
                </p>
              )}
            </label>
          </div>

          <label className="block">
            <span className="eyebrow">Phone</span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+91 98000 00000"
              value={form.phone}
              onChange={(event) => update("phone")(event.target.value)}
              className={`mt-2 ${INPUT_CLASSES}`}
            />
            {formErrors.phone && (
              <p className="mt-1 font-sans text-xs font-medium text-forest">{formErrors.phone}</p>
            )}
          </label>

          <label className="block">
            <span className="eyebrow">Address line 1</span>
            <input
              type="text"
              autoComplete="address-line1"
              placeholder="14, Rajpath Colony"
              value={form.line1}
              onChange={(event) => update("line1")(event.target.value)}
              className={`mt-2 ${INPUT_CLASSES}`}
            />
            {formErrors.line1 && (
              <p className="mt-1 font-sans text-xs font-medium text-forest">{formErrors.line1}</p>
            )}
          </label>

          <label className="block">
            <span className="eyebrow">Address line 2 (optional)</span>
            <input
              type="text"
              autoComplete="address-line2"
              placeholder="Near Diwan-e-Khas"
              value={form.line2}
              onChange={(event) => update("line2")(event.target.value)}
              className={`mt-2 ${INPUT_CLASSES}`}
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <label className="block">
              <span className="eyebrow">City</span>
              <input
                type="text"
                autoComplete="address-level2"
                placeholder="Jaipur"
                value={form.city}
                onChange={(event) => update("city")(event.target.value)}
                className={`mt-2 ${INPUT_CLASSES}`}
              />
              {formErrors.city && (
                <p className="mt-1 font-sans text-xs font-medium text-forest">{formErrors.city}</p>
              )}
            </label>
            <label className="block">
              <span className="eyebrow">State</span>
              <input
                type="text"
                autoComplete="address-level1"
                placeholder="Rajasthan"
                value={form.state}
                onChange={(event) => update("state")(event.target.value)}
                className={`mt-2 ${INPUT_CLASSES}`}
              />
              {formErrors.state && (
                <p className="mt-1 font-sans text-xs font-medium text-forest">{formErrors.state}</p>
              )}
            </label>
            <label className="block">
              <span className="eyebrow">Pincode</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="302019"
                value={form.pincode}
                onChange={(event) => update("pincode")(event.target.value)}
                className={`mt-2 ${INPUT_CLASSES}`}
              />
              {formErrors.pincode && (
                <p className="mt-1 font-sans text-xs font-medium text-forest">
                  {formErrors.pincode}
                </p>
              )}
            </label>
          </div>

          <label className="flex items-center gap-3 font-sans text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => update("isDefault")(event.target.checked)}
              className="h-4 w-4 accent-forest"
            />
            Set as default address
          </label>
        </div>

        <div className="mt-6">
          <Button variant="primary" size="lg" type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Add address"}
          </Button>
        </div>
      </form>
    </div>
  );
}