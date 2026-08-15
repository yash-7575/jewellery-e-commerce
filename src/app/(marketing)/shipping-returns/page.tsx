import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "Free insured shipping across India and worldwide by quote. Fourteen-day returns for unworn pieces, with care notes for everything that leaves the atelier.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-12 md:py-16">
      <Breadcrumbs
        trail={[{ label: "Home", href: "/" }, { label: "Shipping & Returns" }]}
      />

      <div className="mt-8 max-w-2xl">
        <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
          Shipping <span className="font-serif-i">&amp; returns.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
          Every piece travels the way it is made — slowly, carefully, and well protected.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2">
        <section>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-forest">
            Shipping
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-relaxed text-ink/85">
            <li>
              <span className="font-medium text-ink">Free, insured, across India.</span>{" "}
              Delivery in five to seven working days, fully insured at every mile.
            </li>
            <li>
              <span className="font-medium text-ink">International, by quote.</span> We
              ship worldwide at rates confirmed personally for your order — duties and
              taxes are calculated at the time of dispatch.
            </li>
            <li>
              <span className="font-medium text-ink">Tracking within 24 hours.</span> A
              tracking number and your courier reference reach you within a day of the
              piece leaving the atelier.
            </li>
            <li>
              <span className="font-medium text-ink">Signature required.</span> Pieces
              are released only against a signature; kindly ensure someone is present to
              receive yours.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-forest">
            Returns
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-relaxed text-ink/85">
            <li>
              <span className="font-medium text-ink">Fourteen days.</span> Unworn pieces
              may be returned within fourteen days of delivery, in their original box and
              with all certificates.
            </li>
            <li>
              <span className="font-medium text-ink">Refund to your method.</span> Once
              the piece is received and inspected, refunds are made to the original
              payment method within seven business days.
            </li>
            <li>
              <span className="font-medium text-ink">Final sale.</span> Custom and
              engraved pieces are made for you alone and are not eligible for return.
            </li>
          </ul>
        </section>
      </div>

      <section className="mt-16 border-t border-forest/15 pt-10">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-forest">
          A word on care
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/85">
          Jewellery is living material. Wipe your pieces gently with a soft cloth after
          wearing, keep them away from perfume and chemicals, and store them separately so
          gold and stones never meet. For deeper care — a warm soak, a soft brush, an
          unhurried drying — see our care guide. And whenever you wish, the atelier will
          clean and check your piece by hand, without charge, for the life of its owner.
        </p>
      </section>
    </div>
  );
}