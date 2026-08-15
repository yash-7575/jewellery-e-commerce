import type { Metadata } from "next";
import { Breadcrumbs } from "@/components";

export const metadata: Metadata = {
  title: "Care Guide",
  description:
    "How to care for gold, diamonds, and gemstones — the atelier's field notes for a lifetime of wear.",
};

const SECTIONS = [
  {
    title: "Gold",
    body: "22K gold is soft by design — that softness is how it holds a hand-set stone. Wipe it gently with the cloth provided after every wear, and leave it at home for rough days, workouts and pools. If it dulls, a warm soak in mild soapy water, a soft brush, and unhurried drying brings back its warmth. Polish paste is best avoided; the atelier's buffing wheel does it better.",
  },
  {
    title: "Diamonds",
    body: "Diamonds are the hardest thing on earth — but they attract grease and dust the way a good mirror does. A drop of mild dish soap in warm water, a very soft brush, and a rinse restores their brilliance. They wear best when nothing else does: let a solitaire sit alone on the hand, and keep pieces in their own compartments so stones never knock together.",
  },
  {
    title: "Gemstones",
    body: "Each stone has its own temperament. Emerald, a gentle stone, hates abrupt heat and ultrasonic baths — clean it only in lukewarm soapy water. Ruby and sapphire are hardy but still prefer the soft brush over machines. Polki, set in the traditional kundan way, should never be steeped; wipe it soft and dry. When in doubt, bring the piece to the atelier and let us care for it by hand.",
  },
];

const DO_AND_DONT = [
  {
    doIt: [
      "Wipe after wearing, before you put the piece away",
      "Store pieces separately, in their velvet boxes",
      "Have the atelier inspect settings once a year",
      "Bring an old piece in — we clean and check it free",
    ],
    avoid: [
      "Perfume, creams and chemicals — apply before dressing",
      "Chlorine and salt water; leave gold at home for the beach",
      "Ultrasonic cleaners for emerald, polki and antique pieces",
      "Sleeping or bathing in delicate handmade jewellery",
    ],
  },
];

export default function CareGuidePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-12 md:py-16">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Care Guide" }]} />

      <div className="mt-8 max-w-2xl">
        <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
          Field notes on <span className="font-serif-i">a lifetime of wear.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
          Jewellery is living material. Care for it the way the atelier does — slowly,
          gently, and by hand.
        </p>
      </div>

      <div className="mt-14 space-y-8">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="border border-forest/15 bg-creamLight p-8 md:p-10"
          >
            <h2 className="font-serif text-3xl font-medium tracking-tight text-forest">
              {section.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/85">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        {DO_AND_DONT.map((list) => (
          <div
            key="do-dont"
            className="grid grid-cols-1 gap-8 md:grid-cols-2"
          >
            <div className="border border-forest/15 p-8">
              <h2 className="font-serif text-2xl font-medium text-forest">
                Do
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/85">
                {list.doIt.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-serif text-forest">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-forest/15 bg-creamLight p-8">
              <h2 className="font-serif text-2xl font-medium text-forest">
                Avoid
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/85">
                {list.avoid.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-serif text-forest">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-forest">
          The atelier's promise
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-ink/85">
          All of this, done well, is enough for ordinary wear. For the extraordinary — a
          marriage, an heirloom passed on, a piece that has travelled — the atelier
          gladly inspects, cleans and restores your jewellery by hand, without charge,
          for as long as you own it.
        </p>
      </section>
    </div>
  );
}