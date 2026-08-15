import Link from "next/link";

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-cream text-forest border-b border-forest/20">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl tracking-wide">
          AARANYA
        </Link>

        <nav className="flex items-center font-sans uppercase text-xs tracking-widest">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-8 hover:opacity-70 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 text-forest">
          <button type="button" aria-label="search" className="hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button type="button" aria-label="account" className="hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          </button>
          <button type="button" aria-label="wishlist" className="hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="cart"
            className="relative hover:opacity-70 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2l-3 6v14a2 2 0 002 2h14a2 2 0 002-2V8l-3-6z" />
              <line x1="3" y1="8" x2="21" y2="8" />
              <path d="M16 12a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[10px] font-medium leading-none text-cream">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}