import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers from the AARANYA atelier — sourcing, metals, care, sizing, commissions, and authentication.",
};

const FAQS = [
  {
    question: "Are your diamonds ethically sourced?",
    answer:
      "They are. Every diamond and polki in the atelier is conflict-free, and the house has worked with the same trusted suppliers since before the term ethical was in fashion. Sourcing papers accompany each stone, and we are glad to share a piece's provenance with you over tea.",
  },
  {
    question: "What is 22K gold vs 18K?",
    answer:
      "22K gold is ninety-one point six percent pure gold — the traditional standard of the Jaipur atelier, warm in colour and soft enough to hold hand-set stones the old way. 18K, at seventy-five percent, is firmer and sits closer to European house style. For daily heirloom wear most of our collectors choose 22K; for very fine, intricate work we sometimes counsel 18K. Both are honest gold, hallmarked, and finished in the same unhurried way.",
  },
  {
    question: "How do I care for my pieces?",
    answer:
      "Gently. Wipe gold with a soft cloth after wearing; keep pieces away from perfume, creams and chlorine; store each piece separately, in its box, so metal and stones never touch. A deep clean — warm soapy water and a very soft brush — served with patience, is all a gem needs. The atelier will also clean and inspect any piece by hand, without charge, whenever you wish.",
  },
  {
    question: "Do you resize rings?",
    answer:
      "We do, and gladly. Ring resizing is done in our own atelier, never outsourced, so the setting and finish stay exactly as they were made. Most sizes are adjusted within two weeks. Please write to us first so we can advise on your piece — some designs, like eternity bands, cannot be sized without disturbing the stones.",
  },
  {
    question: "Do you buy back old jewellery?",
    answer:
      "The atelier accepts its own older pieces, and sometimes pieces of great craftsmanship from other houses. Every piece is evaluated by hand, in person or by appointment, against prevailing gold and stone values. For a considered quote, kindly bring the piece — and its story — to the salon.",
  },
  {
    question: "Custom designs — how long and how much?",
    answer:
      "A commission is a slow courtship. From first sketch to finished piece, allow six to ten weeks — more for ambitious settings or for stones we must source. The price is fixed together, after design and materials are known, and always before work begins. For stones you already own, there is only the making.",
  },
  {
    question: "Payment methods accepted?",
    answer:
      "We accept all major cards, UPI, and bank transfer, in Indian rupees. For collectors abroad, we arrange international payment by mutual agreement. Every payment is processed securely, and invoices and certificates accompany both the payment and the piece.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We do, worldwide by quote. Orders are shipped fully insured and sent with tracking; duties and taxes are calculated at dispatch, when the route is known. Every international parcel is signed for on arrival. For commissions and very high-value pieces, we often recommend the piece travel by hand — it has made it home that way for a century.",
  },
  {
    question: "Do you offer a warranty or repair?",
    answer:
      "Every piece carries the atelier's lifetime promise: we will restore, reset, and re-polish your jewellery for as long as you own it. Normal wear is covered without charge — accidental loss or damage is repaired at cost, and always by our own setters, never a stranger's bench.",
  },
  {
    question: "How do I authenticate my AARANYA piece?",
    answer:
      "Beautifully. Each piece leaves the atelier with a signed certificate of authenticity, engraved with your name, the date, and the maker who set the stones. The hallmark and stone specifications are also recorded. If you own an antique AARANYA piece without papers, write to us — the house keeps its ledgers from 1908, and we take great pleasure in finding your piece in them.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-12 md:py-16">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />

      <div className="mt-8 max-w-2xl">
        <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
          Questions, <span className="font-serif-i">answered by hand.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
          Everything collectors ask us, answered in the voice of the atelier. For anything
          left unasked, write to us — we answer every letter personally.
        </p>
      </div>

      <div className="mt-12 max-w-3xl">
        {FAQS.map((faq) => (
          <details
            key={faq.question}
            className="group border-b border-forest/15 py-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-xl text-ink transition-colors hover:text-forest [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <span className="shrink-0 font-sans text-2xl font-light text-forest transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/85">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}