import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Write to the AARANYA atelier — commissions, viewings, and questions, answered by hand.",
};

const DETAILS = [
  {
    eyebrow: "Write",
    value: "hello@aaranya.in",
    href: "mailto:hello@aaranya.in",
  },
  {
    eyebrow: "WhatsApp",
    value: "+91 98290 00000",
    href: "https://wa.me/919829000000",
  },
  {
    eyebrow: "Atelier",
    value: "Chandpol Bazaar, Jaipur, Rajasthan 302006",
  },
  {
    eyebrow: "Hours",
    value: "By appointment, seven days — ten in the morning to seven in the evening",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-12 md:py-16">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <div className="mt-8 max-w-2xl">
        <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
          Get in <span className="font-serif-i">touch.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
          Whether you write about a commission, a resizing, or a stone you have loved for a
          long time — every note is read in the atelier and answered personally.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-14 md:grid-cols-2">
        <div>
          <ContactForm />
        </div>

        <div className="space-y-8">
          <div className="eyebrow">The Atelier</div>
          <dl className="space-y-6">
            {DETAILS.map((detail) => (
              <div key={detail.eyebrow}>
                <dt className="font-sans text-xs uppercase tracking-[0.22em] text-forest">
                  {detail.eyebrow}
                </dt>
                <dd className="mt-1">
                  {detail.href ? (
                    <a
                      href={detail.href}
                      target={detail.href.startsWith("http") ? "_blank" : undefined}
                      rel={detail.href.startsWith("http") ? "noreferrer" : undefined}
                      className="font-serif text-xl text-ink transition-opacity hover:opacity-70"
                    >
                      {detail.value}
                    </a>
                  ) : (
                    <span className="font-serif text-xl text-ink">{detail.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-forest/15 pt-8">
            <p className="text-sm leading-relaxed text-ink/85">
              For private appointments and bespoke commissions, the atelier keeps its doors
              open by arrangement. Kindly write ahead — the benches are often full.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}