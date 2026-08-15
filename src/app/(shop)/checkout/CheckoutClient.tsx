"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, EmptyState, PriceTag } from "@/components";
import type { Address } from "@/components/types";
import {
  createOrder,
  createRazorpayOrder,
  getAccessToken,
  verifyRazorpayPayment,
} from "@/lib/api";
import { useCart } from "@/lib/cart";
import { loadRazorpayScript } from "@/lib/razorpay";

const ADDRESS_STORAGE_KEY = "aaranya_checkout_address";

const STEPS = ["address", "payment", "review"] as const;
type Step = (typeof STEPS)[number];

interface AddressForm {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

const INPUT_CLASSES =
  "w-full border border-black/10 bg-cream px-4 py-3 font-sans text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none";

const formatInr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 font-sans text-xs font-medium text-forest">{error}</p>}
    </label>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const currentIndex = STEPS.indexOf(step);
  return (
    <ol className="mt-8 flex flex-wrap items-center gap-3 font-sans text-xs uppercase tracking-widest">
      {STEPS.map((label, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;
        return (
          <li key={label} className="flex items-center gap-3">
            {index > 0 && <span aria-hidden className="h-px w-8 bg-black/10" />}
            <span
              className={`flex items-center gap-2 ${isCurrent ? "text-forest" : "text-muted"}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                  isCurrent
                    ? "border-forest bg-forest text-cream"
                    : isDone
                      ? "border-forest text-forest"
                      : "border-black/20 text-muted"
                }`}
              >
                {index + 1}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderSummaryPanel({
  count,
  subtotal,
  children,
}: {
  count: number;
  subtotal: number;
  children?: ReactNode;
}) {
  return (
    <div className="border border-black/5 bg-creamLight p-8">
      <h2 className="eyebrow">Order summary</h2>
      <dl className="mt-6 space-y-4 font-sans text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">
            Subtotal ({count} {count === 1 ? "piece" : "pieces"})
          </dt>
          <dd>
            <PriceTag amountInr={subtotal} size="sm" />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Shipping</dt>
          <dd className="text-right text-xs text-ink/85">
            Free — ships within India in 5–7 days
          </dd>
        </div>
      </dl>
      {children}
      <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-6">
        <span className="font-sans text-sm font-medium text-ink">Total</span>
        <PriceTag amountInr={subtotal} size="lg" />
      </div>
    </div>
  );
}

function CheckoutFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, count, subtotal, ready, clearCart } = useCart();

  const stepParam = searchParams.get("step") as Step | null;
  const step: Step = stepParam && STEPS.includes(stepParam) ? stepParam : "address";

  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  const [hasToken, setHasToken] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasToken(Boolean(getAccessToken()));
    try {
      const raw = window.sessionStorage.getItem(ADDRESS_STORAGE_KEY);
      if (raw) setAddress({ ...EMPTY_ADDRESS, ...(JSON.parse(raw) as Partial<AddressForm>) });
    } catch {
      // ignore malformed session data
    }
  }, []);

  const setStep = (next: Step) => {
    router.replace(next === "address" ? "/checkout" : `/checkout?step=${next}`);
  };

  const update = (key: keyof AddressForm) => (value: string) => {
    setAddress((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submitAddress = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof AddressForm, string>> = {};
    if (!address.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(address.email.trim()))
      nextErrors.email = "A valid email is required.";
    if (!address.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!address.addressLine1.trim()) nextErrors.addressLine1 = "Address line 1 is required.";
    if (!address.city.trim()) nextErrors.city = "City is required.";
    if (!address.state.trim()) nextErrors.state = "State is required.";
    if (!/^\d{6}$/.test(address.pincode.trim()))
      nextErrors.pincode = "Enter a 6-digit pincode.";
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    try {
      window.sessionStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));
    } catch {
      // storage unavailable — address stays in state for this session
    }
    setStep("payment");
  };

  const payNow = async () => {
    setError(null);
    setPaying(true);
    try {
      const shippingAddress: Address = {
        addressId: "",
        label: "Home",
        recipient: address.fullName.trim(),
        phone: address.phone.trim(),
        line1: address.addressLine1.trim(),
        line2: address.addressLine2.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        country: address.country.trim() || "India",
        isDefault: true,
      };

      const order = await createOrder({
        items,
        shippingAddress,
        email: address.email.trim(),
      });
      const orderId = order.orderId;

      const rzpOrder = await createRazorpayOrder(orderId);
      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: rzpOrder.key_id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        order_id: rzpOrder.razorpay_order_id,
        name: "AARANYA",
        description: "Jewellery order",
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            clearCart();
            router.push(`/order/${orderId}`);
          } catch {
            setPaying(false);
            setError(
              "Payment was received but verification failed. Please contact the atelier with your order id.",
            );
          }
        },
        prefill: {
          name: address.fullName.trim(),
          email: address.email.trim(),
          contact: address.phone.trim(),
        },
        theme: { color: "#0d5545" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      rzp.open();
    } catch (err) {
      setPaying(false);
      setError(
        err instanceof Error ? err.message : "Something went wrong while starting payment.",
      );
    }
  };

  if (!ready) {
    return (
      <div className="mt-10 animate-pulse space-y-6">
        <div className="h-10 w-2/3 bg-creamDark" />
        <div className="h-64 bg-creamDark" />
        <div className="h-40 bg-creamDark" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        body="Add a piece to your bag before checking out."
        cta={{ label: "Explore the collection", href: "/shop" }}
      />
    );
  }

  return (
    <>
      <StepIndicator step={step} />

      <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {step === "address" && (
            <form onSubmit={submitAddress} noValidate className="space-y-6">
              <h2 className="font-serif text-2xl text-ink">
                Delivery <span className="font-serif-i">details</span>
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Full name" error={errors.fullName}>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Ananya Sharma"
                    value={address.fullName}
                    onChange={(e) => update("fullName")(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="ananya@example.com"
                    value={address.email}
                    onChange={(e) => update("email")(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98000 00000"
                    value={address.phone}
                    onChange={(e) => update("phone")(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </Field>
                <Field label="Country">
                  <input
                    type="text"
                    autoComplete="country-name"
                    value={address.country}
                    onChange={(e) => update("country")(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </Field>
              </div>

              <Field label="Address line 1" error={errors.addressLine1}>
                <input
                  type="text"
                  autoComplete="address-line1"
                  placeholder="14, Rajpath Colony"
                  value={address.addressLine1}
                  onChange={(e) => update("addressLine1")(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Address line 2 (optional)">
                <input
                  type="text"
                  autoComplete="address-line2"
                  placeholder="Near Diwan-e-Khas"
                  value={address.addressLine2}
                  onChange={(e) => update("addressLine2")(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </Field>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Field label="City" error={errors.city}>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Jaipur"
                    value={address.city}
                    onChange={(e) => update("city")(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </Field>
                <Field label="State" error={errors.state}>
                  <input
                    type="text"
                    autoComplete="address-level1"
                    placeholder="Rajasthan"
                    value={address.state}
                    onChange={(e) => update("state")(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </Field>
                <Field label="Pincode" error={errors.pincode}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="302019"
                    value={address.pincode}
                    onChange={(e) => update("pincode")(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button variant="primary" size="lg" type="submit">
                  Continue to payment
                </Button>
                <Button variant="link" size="md" href="/cart">
                  Back to bag
                </Button>
              </div>
            </form>
          )}

          {step === "payment" && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-ink">
                  Pay<span className="font-serif-i">ment</span>
                </h2>

                <div className="mt-6 border border-black/5 bg-creamLight p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow">Delivering to</p>
                      <p className="mt-3 font-sans text-sm font-medium text-ink">
                        {address.fullName}
                      </p>
                      <p className="mt-1 font-sans text-sm text-muted">
                        {address.addressLine1}
                        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                      </p>
                      <p className="font-sans text-sm text-muted">
                        {address.city}, {address.state} {address.pincode} · {address.country}
                      </p>
                      <p className="mt-1 font-sans text-xs text-muted">
                        {address.email} · {address.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("address")}
                      className="font-sans text-xs font-medium text-forest underline underline-offset-4 hover:opacity-70"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="eyebrow">Payment method</p>
                <label className="mt-3 flex cursor-pointer items-start gap-3 border border-forest bg-creamLight p-5">
                  <input
                    type="radio"
                    name="payment-method"
                    checked
                    readOnly
                    className="mt-0.5 accent-forest"
                  />
                  <span>
                    <span className="font-sans text-sm font-medium text-ink">Razorpay</span>
                    <span className="mt-1 block font-sans text-xs text-muted">
                      Cards, UPI &amp; netbanking — secured by Razorpay
                    </span>
                  </span>
                </label>
              </div>

              {error && (
                <p className="border border-forest/30 bg-creamLight p-4 font-sans text-sm text-forest">
                  {error}
                </p>
              )}

              {hasToken ? (
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={payNow}
                    disabled={paying}
                    className="inline-flex items-center justify-center bg-forest px-7 py-3.5 font-sans text-base font-medium text-cream transition-colors hover:bg-forestDark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paying ? "Preparing secure payment…" : `Pay Now — ${formatInr(subtotal)}`}
                  </button>
                  <Button variant="link" size="md" href="/cart">
                    Back to bag
                  </Button>
                </div>
              ) : (
                <div className="border border-black/5 bg-creamLight p-6">
                  <p className="font-sans text-sm text-ink">
                    Please sign in to complete checkout.
                  </p>
                  <div className="mt-4">
                    <Button variant="primary" size="md" href="/login">
                      Sign in
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-forest border-t-transparent" />
              <h2 className="mt-6 font-serif text-2xl text-ink">
                Confirming your <span className="font-serif-i">order</span>
              </h2>
              <p className="mt-3 font-sans text-sm text-muted">
                A moment — we are confirming your payment with the atelier.
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <OrderSummaryPanel count={count} subtotal={subtotal}>
            <ul className="mt-6 space-y-4 border-t border-black/5 pt-6">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-4">
                  <span className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-sm bg-cream">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-sm text-ink">
                      {item.name}
                    </span>
                    <span className="block font-sans text-xs text-muted">
                      Qty {item.quantity}
                    </span>
                  </span>
                  <PriceTag amountInr={item.priceInr * item.quantity} size="sm" />
                </li>
              ))}
            </ul>
          </OrderSummaryPanel>
        </aside>
      </div>
    </>
  );
}

export default function CheckoutClient() {
  return (
    <Suspense
      fallback={
        <div className="mt-10 animate-pulse space-y-6">
          <div className="h-10 w-2/3 bg-creamDark" />
          <div className="h-64 bg-creamDark" />
        </div>
      }
    >
      <CheckoutFlow />
    </Suspense>
  );
}
