import Image from "next/image";
import NewsletterForm from "../components/NewsletterForm";

export default function Home() {
  return (
    <>
      <header className="w-full bg-cream/95 backdrop-blur sticky top-0 z-50 border-b border-black/5">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-8 text-sm">
            <a href="#shop" className="hover:opacity-70">Shop</a>
            <a href="#collections" className="hover:opacity-70">Collections</a>
            <a href="#about" className="hover:opacity-70">About</a>
            <a href="#contact" className="hover:opacity-70">Contact</a>
          </nav>
          <a href="#" className="font-serif text-2xl tracking-[0.35em] font-medium">AARANYA</a>
          <div className="flex items-center gap-5 text-ink">
            <button aria-label="account" className="hover:opacity-70">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
            </button>
            <button aria-label="wishlist" className="hover:opacity-70">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </button>
            <button aria-label="bag" className="relative hover:opacity-70">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2l-3 6v14a2 2 0 002 2h14a2 2 0 002-2V8l-3-6z" /><line x1="3" y1="8" x2="21" y2="8" /><path d="M16 12a4 4 0 01-8 0" /></svg>
            </button>
          </div>
        </div>
      </header>

      <section className="relative w-full">
        <div className="relative w-full h-[86vh] min-h-[560px] max-h-[820px] overflow-hidden">
          <Image
            src="/images/00-hero-chain.jpg"
            alt="Gold chain on red silk"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent"></div>
          <div className="relative z-10 max-w-[1400px] mx-auto px-8 h-full flex items-center">
            <div className="max-w-xl text-cream">
              <h1 className="font-serif text-[56px] md:text-[72px] leading-[1.02] font-medium tracking-tight">
                LIGHT, <span className="font-serif-i">RENDERED</span><br />ETERNAL.
              </h1>
              <p className="mt-6 text-sm md:text-base text-cream/85 max-w-sm leading-relaxed">
                Hand-set diamonds and 22K gold,<br />composed by our atelier in Jaipur.
              </p>
              <a href="#collections" className="btn-pill mt-8">
                Discover the Collection
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-32">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="relative rounded-sm overflow-hidden">
            <Image
              src="/images/02-hero-bangle-sand-dune.jpg"
              alt="Emerald kundan bangle on golden sand"
              fill
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 px-10 md:px-16 text-ink">
                <div>
                  <div className="font-serif text-5xl md:text-6xl font-medium">3.5k</div>
                  <div className="eyebrow mt-2">Unique Jewels</div>
                </div>
                <div>
                  <div className="font-serif text-5xl md:text-6xl font-medium">98%</div>
                  <div className="eyebrow mt-2">Satisfaction Rate</div>
                </div>
                <div>
                  <div className="font-serif text-5xl md:text-6xl font-medium">49k+</div>
                  <div className="eyebrow mt-2">Happy Customers</div>
                </div>
                <div>
                  <div className="font-serif text-5xl md:text-6xl font-medium">1.7k</div>
                  <div className="eyebrow mt-2">Luxury Collections</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="collections" className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <div className="eyebrow">Featured</div>
          <h2 className="font-serif text-5xl md:text-6xl mt-3 font-medium tracking-tight">
            Four maisons <span className="font-serif-i">of light.</span>
          </h2>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/06-emerald-ring-on-hibiscus.jpg"
                  alt="Emerald Elegance"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <h3 className="font-serif text-xl mt-4">Emerald Elegance</h3>
              <p className="text-xs text-muted mt-1 tracking-wide">Emerald &amp; Diamond</p>
            </div>
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/04-ruby-necklace-on-lotus.jpg"
                  alt="Ruby Radiance"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <h3 className="font-serif text-xl mt-4">Ruby Radiance</h3>
              <p className="text-xs text-muted mt-1 tracking-wide">Ruby &amp; Gold</p>
            </div>
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/08-hand-with-ring.jpg"
                  alt="Diamond Ear Ring"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <h3 className="font-serif text-xl mt-4">Polki Reverie</h3>
              <p className="text-xs text-muted mt-1 tracking-wide">Uncut Diamond &amp; Ruby</p>
            </div>
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/03-jhumka-on-marigold.jpg"
                  alt="Genda Jhumka"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <h3 className="font-serif text-xl mt-4">Genda Jhumka</h3>
              <p className="text-xs text-muted mt-1 tracking-wide">Gold &amp; Meenakari</p>
            </div>
          </div>

          <div className="mt-12">
            <a href="#shop" className="btn-pill">View All Collections
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-center mb-14">
            <div className="eyebrow">Best Sellers</div>
            <h2 className="font-serif text-5xl md:text-6xl mt-3 font-medium tracking-tight leading-[1.05]">
              A century of quiet<br />obsession <span className="font-serif-i">with light.</span>
            </h2>
            <p className="text-sm text-muted max-w-md mx-auto mt-5 leading-relaxed">
              Founded in Jaipur in 1908, our atelier still sets every stone by hand.
              Each piece is a study in restraint — the last unnecessary line always removed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 relative rounded-sm overflow-hidden aspect-[16/10]">
              <Image
                src="/images/01-hero-ring-red-silk-swirl.jpg"
                alt="Polki solitaire on silk"
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-6">
              <div className="card-hover">
                <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[4/5]">
                  <Image
                    src="/images/04-ruby-necklace-on-lotus.jpg"
                    alt="Ligne d'Or Necklace"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span className="heart">♡</span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <div>
                    <h3 className="font-serif text-lg">Kamal Ruby Necklace</h3>
                    <p className="text-[11px] text-muted mt-0.5">22K Gold · Handwoven</p>
                  </div>
                  <div className="text-sm font-medium">₹1,85,000</div>
                </div>
              </div>
              <div className="card-hover">
                <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[4/5]">
                  <Image
                    src="/images/05-bangle-on-jasmine.jpg"
                    alt="Mogra Diamond Bangle"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span className="heart">♡</span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <div>
                    <h3 className="font-serif text-lg">Mogra Diamond Bangle</h3>
                    <p className="text-[11px] text-muted mt-0.5">22K Gold · Uncut Polki</p>
                  </div>
                  <div className="text-sm font-medium">₹1,28,000</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a href="#about" className="btn-pill">The House
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
          </div>
        </div>
      </section>

      <section id="shop" className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <div className="eyebrow">Best Sellers</div>
          <h2 className="font-serif text-5xl md:text-6xl mt-3 font-medium tracking-tight">
            Coveted by <span className="font-serif-i">our clientele.</span>
          </h2>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/05-bangle-on-jasmine.jpg"
                  alt="Mogra Diamond Bangle"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <h3 className="font-serif text-lg">Mogra Bangle</h3>
                  <p className="text-[11px] text-muted mt-0.5">22K Gold · Uncut Polki</p>
                </div>
                <div className="text-sm font-medium">₹1,28,000</div>
              </div>
            </div>
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/06-emerald-ring-on-hibiscus.jpg"
                  alt="Panna Kundan Ring"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <h3 className="font-serif text-lg">Panna Kundan Ring</h3>
                  <p className="text-[11px] text-muted mt-0.5">22K Gold · Emerald</p>
                </div>
                <div className="text-sm font-medium">₹95,000</div>
              </div>
            </div>
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/04-ruby-necklace-on-lotus.jpg"
                  alt="Kamal Ruby Necklace"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <h3 className="font-serif text-lg">Kamal Necklace</h3>
                  <p className="text-[11px] text-muted mt-0.5">22K Gold · Handwoven</p>
                </div>
                <div className="text-sm font-medium">₹1,85,000</div>
              </div>
            </div>
            <div className="card-hover">
              <div className="relative bg-creamLight rounded-sm overflow-hidden aspect-[3/4]">
                <Image
                  src="/images/03-jhumka-on-marigold.jpg"
                  alt="Genda Jhumka"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="heart">♡</span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <h3 className="font-serif text-lg">Genda Jhumka</h3>
                  <p className="text-[11px] text-muted mt-0.5">22K Gold · Meenakari</p>
                </div>
                <div className="text-sm font-medium">₹58,000</div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <a href="#shop" className="btn-pill">View All Collections
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <div className="eyebrow">Follow the House</div>
          <h2 className="font-serif text-5xl md:text-6xl mt-3 font-medium tracking-tight">@aaranya</h2>

          <div className="mt-12 grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="aspect-[2/3] overflow-hidden"><Image src="/images/instagram-grid/1-shoulder-lily-drop-earring.jpg" width={600} height={900} className="w-full h-full object-cover card-hover" sizes="(max-width: 768px) 33vw, 16vw" alt="" /></div>
            <div className="aspect-[2/3] overflow-hidden"><Image src="/images/instagram-grid/2-jasmine-gold-oval-pendant.jpg" width={600} height={900} className="w-full h-full object-cover card-hover" sizes="(max-width: 768px) 33vw, 16vw" alt="" /></div>
            <div className="aspect-[2/3] overflow-hidden"><Image src="/images/instagram-grid/3-model-lily-face-ring.jpg" width={600} height={900} className="w-full h-full object-cover card-hover" sizes="(max-width: 768px) 33vw, 16vw" alt="" /></div>
            <div className="aspect-[2/3] overflow-hidden"><Image src="/images/instagram-grid/4-face-eternity-band.jpg" width={600} height={900} className="w-full h-full object-cover card-hover" sizes="(max-width: 768px) 33vw, 16vw" alt="" /></div>
            <div className="aspect-[2/3] overflow-hidden"><Image src="/images/instagram-grid/5-side-profile-cascade-earring.jpg" width={600} height={900} className="w-full h-full object-cover card-hover" sizes="(max-width: 768px) 33vw, 16vw" alt="" /></div>
            <div className="aspect-[2/3] overflow-hidden"><Image src="/images/instagram-grid/6-jasmine-gold-earring-ladybug.jpg" width={600} height={900} className="w-full h-full object-cover card-hover" sizes="(max-width: 768px) 33vw, 16vw" alt="" /></div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <div className="eyebrow">In Their Words</div>
          <h2 className="font-serif text-5xl md:text-6xl mt-3 font-medium tracking-tight">
            From our <span className="font-serif-i">customers</span>
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            <div>
              <div className="text-4xl font-serif text-forest leading-none">&ldquo;</div>
              <p className="mt-3 text-sm leading-relaxed text-ink/85">
                Every piece feels like a whisper of the old couture houses. The finish is beyond reproach.
              </p>
              <div className="mt-6">
                <p className="text-sm font-medium">Isabela M.</p>
                <p className="text-[11px] text-muted mt-0.5">Milan</p>
              </div>
            </div>
            <div>
              <div className="text-4xl font-serif text-forest leading-none">&ldquo;</div>
              <p className="mt-3 text-sm leading-relaxed text-ink/85">
                My solitaire arrived in a velvet box that already felt like an heirloom. The stone is extraordinary.
              </p>
              <div className="mt-6">
                <p className="text-sm font-medium">Camille R.</p>
                <p className="text-[11px] text-muted mt-0.5">Paris</p>
              </div>
            </div>
            <div>
              <div className="text-4xl font-serif text-forest leading-none">&ldquo;</div>
              <p className="mt-3 text-sm leading-relaxed text-ink/85">
                The atelier answered every question personally. Rare, and quite lovely.
              </p>
              <div className="mt-6">
                <p className="text-sm font-medium">Sofia A.</p>
                <p className="text-[11px] text-muted mt-0.5">New York</p>
              </div>
            </div>
            <div>
              <div className="text-4xl font-serif text-forest leading-none">&ldquo;</div>
              <p className="mt-3 text-sm leading-relaxed text-ink/85">
                Every stone has been chosen with such intention. It reads on the finger.
              </p>
              <div className="mt-6">
                <p className="text-sm font-medium">Ananya K.</p>
                <p className="text-[11px] text-muted mt-0.5">Mumbai</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forest"></span>
            <span className="w-2 h-2 rounded-full bg-ink/20"></span>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="relative rounded-sm overflow-hidden">
            <Image
              src="/images/01-hero-ring-red-silk-swirl.jpg"
              alt="Silk swirl"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent"></div>
            <div className="absolute inset-0 flex items-end">
              <div className="w-full max-w-lg px-10 md:px-16 pb-14 text-cream">
                <h3 className="font-serif text-4xl md:text-5xl font-medium leading-[1.1]">
                  Letters from the <span className="font-serif-i">atelier.</span>
                </h3>
                <p className="text-sm text-cream/85 mt-3 max-w-sm">
                  Private previews, new pieces, and invitations to our salons.
                </p>
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="pt-16 pb-10 border-t border-black/5 mt-8">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <div className="font-serif text-2xl tracking-[0.35em] font-medium">AARANYA</div>
              <p className="text-xs text-muted mt-4 leading-relaxed max-w-xs">
                Fine jewellery maison. Founded in Jaipur, 22K &amp; polki diamond, set by hand.
              </p>
              <div className="mt-6 space-y-1.5 text-xs">
                <p className="text-muted">Social Links</p>
                <a className="block hover:opacity-70" href="#">Instagram</a>
                <a className="block hover:opacity-70" href="#">Pinterest</a>
                <a className="block hover:opacity-70" href="#">YouTube</a>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-3">Shop</p>
              <ul className="space-y-1.5 text-sm">
                <li><a className="hover:opacity-70" href="#">Diamond</a></li>
                <li><a className="hover:opacity-70" href="#">Gold</a></li>
                <li><a className="hover:opacity-70" href="#">Wedding</a></li>
                <li><a className="hover:opacity-70" href="#">New Arrivals</a></li>
                <li><a className="hover:opacity-70" href="#">Gift Cards</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted mb-3">Client Services</p>
              <ul className="space-y-1.5 text-sm">
                <li><a className="hover:opacity-70" href="#">Contact</a></li>
                <li><a className="hover:opacity-70" href="#">Appointments</a></li>
                <li><a className="hover:opacity-70" href="#">Sizing Guide</a></li>
                <li><a className="hover:opacity-70" href="#">Care &amp; Repair</a></li>
                <li><a className="hover:opacity-70" href="#">Shipping</a></li>
              </ul>
              <p className="text-xs text-muted mt-8 mb-3">Legal</p>
              <ul className="space-y-1.5 text-sm">
                <li><a className="hover:opacity-70" href="#">Terms</a></li>
                <li><a className="hover:opacity-70" href="#">Privacy</a></li>
                <li><a className="hover:opacity-70" href="#">Cookies</a></li>
                <li><a className="hover:opacity-70" href="#">Accessibility</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted mb-3">The House</p>
              <ul className="space-y-1.5 text-sm">
                <li><a className="hover:opacity-70" href="#">Our Story</a></li>
                <li><a className="hover:opacity-70" href="#">Craftsmanship</a></li>
                <li><a className="hover:opacity-70" href="#">Journal</a></li>
                <li><a className="hover:opacity-70" href="#">Boutiques</a></li>
                <li><a className="hover:opacity-70" href="#">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-6 border-t border-black/5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted">© MMXXVI AARANYA Maison Jaipur — India</p>
            <div className="text-xs text-muted">Hand-set in Jaipur, delivered worldwide</div>
          </div>
        </div>
      </footer>
    </>
  );
}