import Link from "next/link";
import { default as NewsletterForm } from "./NewsletterForm";

const SHOP_LINKS = [
  { label: "Rings", href: "/shop/rings" },
  { label: "Necklaces", href: "/shop/necklaces" },
  { label: "Earrings", href: "/shop/earrings" },
  { label: "Bracelets", href: "/shop/bracelets" },
  { label: "Bangles", href: "/shop/bangles" },
  { label: "Jhumkas", href: "/shop/jhumkas" },
];

const HELP_LINKS = [
  { label: "Contact", href: "/contact" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "FAQ", href: "/faq" },
  { label: "Care Guide", href: "/care-guide" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-forest/20 bg-cream text-forest pt-16 pb-10">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="font-serif text-2xl tracking-[0.35em] font-medium">AARANYA</div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted">
              Hand-set diamonds &amp; 22K gold.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Founded in Jaipur in 1908, our atelier still sets every stone by hand.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs text-muted">Shop</p>
            <ul className="space-y-1.5 text-sm">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:opacity-70 transition-opacity">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs text-muted">Help</p>
            <ul className="space-y-1.5 text-sm">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:opacity-70 transition-opacity">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs text-muted">Newsletter</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-forest/20 pt-6">
          <p className="text-xs text-muted">© AARANYA 2026 · Jaipur, India</p>
          <div className="flex items-center gap-4 text-muted">
            <a
              href="https://instagram.com/aaranya"
              aria-label="Instagram"
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://facebook.com/aaranya"
              aria-label="Facebook"
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 011-1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}