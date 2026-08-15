import Image from "next/image";
import type { Metadata } from "next";
import { Button } from "@/components";

export const metadata: Metadata = {
  title: "About",
  description:
    "Founded in Jaipur in 1908, the AARANYA atelier still sets every stone by hand.",
};

const CRAFTS = [
  {
    title: "Set by hand",
    body: "Every stone is seated in its kundan bed the old way — by fingers that have learned the pressure of a single stone over decades. No casting, no shortcuts; the atelier still sets every stone by hand.",
  },
  {
    title: "Chosen stone by stone",
    body: "Hand-selection of stones is a quiet ritual. Each polki, each emerald, each seed of diamond is held to the light and weighed for colour, clarity and life before it earns a place in a piece.",
  },
  {
    title: "The last line removed",
    body: "Craft is restraint. A design is argued over until the last unnecessary line has been removed — until nothing further can be taken away, and only the essential remains.",
  },
];

const MILESTONES = [
  {
    year: "1908",
    title: "Founded in Jaipur",
    body: "A small atelier opens its doors in the walled bazaar, setting uncut polki in 22K gold for the weddings of the old city.",
  },
  {
    year: "1952",
    title: "First international commission",
    body: "The house is asked to compose a bridal set for a Maharaja's daughter married abroad — the beginning of AARANYA's quiet life beyond India.",
  },
  {
    year: "1998",
    title: "Heritage recognition",
    body: "The atelier is recognised as a living repository of the kundan craft, and the third generation of setters continues the line.",
  },
  {
    year: "2024",
    title: "The modern atelier",
    body: "A new generation opens the atelier to the world online, while the benches — and the hands upon them — remain the same.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[62vh] min-h-[480px] w-full overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&h=1100&q=80"
            alt="A hand-set diamond ring held in warm atelier light"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
          <div className="relative z-10 mx-auto flex h-full max-w-[1400px] items-center px-8">
            <div className="max-w-xl text-cream">
              <div className="eyebrow text-cream/80">The House</div>
              <h1 className="mt-3 font-serif text-[48px] leading-[1.05] font-medium tracking-tight md:text-[72px]">
                A century of quiet obsession <span className="font-serif-i">with light.</span>
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/85 md:text-base">
                Founded in Jaipur in 1908, our atelier still sets every stone by hand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our craft */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-8 text-center">
          <div className="eyebrow">Our Craft</div>
          <h2 className="mt-3 font-serif text-5xl font-medium tracking-tight md:text-6xl">
            The discipline of <span className="font-serif-i">the hand.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted">
            Each piece is a study in restraint — the last unnecessary line always removed.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {CRAFTS.map((craft) => (
              <div
                key={craft.title}
                className="border border-forest/15 bg-creamLight p-8 text-left"
              >
                <h3 className="font-serif text-xl text-forest">{craft.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/85">{craft.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Since 1908 */}
      <section className="bg-forest py-16 text-cream md:py-24">
        <div className="mx-auto max-w-[1400px] px-8">
          <div className="text-center">
            <div className="eyebrow text-cream/70">Since 1908</div>
            <h2 className="mt-3 font-serif text-5xl font-medium tracking-tight md:text-6xl">
              One family, <span className="font-serif-i">four generations</span> of setters.
            </h2>
          </div>

          <ol className="mx-auto mt-14 max-w-3xl">
            {MILESTONES.map((milestone, index) => (
              <li
                key={milestone.year}
                className="relative border-l border-cream/25 pb-12 pl-8 last:pb-0"
              >
                {index + 1 < MILESTONES.length && (
                  <span className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-cream/70 bg-forest" />
                )}
                <div className="font-serif text-4xl font-medium text-cream">
                  {milestone.year}
                </div>
                <div className="mt-1 font-sans text-xs uppercase tracking-[0.22em] text-cream/70">
                  {milestone.title}
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/85">
                  {milestone.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Visit */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-8 text-center">
          <div className="eyebrow">Visit</div>
          <h2 className="mt-3 font-serif text-5xl font-medium tracking-tight md:text-6xl">
            Find the atelier <span className="font-serif-i">in the old city.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted">
            The salon opens its shutters to the late-afternoon light of the bazaar. Viewings
            are unhurried and always by appointment.
          </p>

          <div className="mx-auto mt-10 max-w-md">
            <dl className="space-y-4">
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.22em] text-forest">
                  Atelier
                </dt>
                <dd className="mt-1 font-serif text-xl">
                  Chandpol Bazaar, Jaipur, Rajasthan 302006
                </dd>
              </div>
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.22em] text-forest">
                  By Appointment
                </dt>
                <dd className="mt-1 font-serif text-xl">Seven days, ten to seven</dd>
              </div>
            </dl>

            <div className="mt-12">
              <Button variant="primary" size="lg" href="/contact">
                Book a viewing
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}