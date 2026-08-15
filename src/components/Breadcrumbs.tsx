import Link from "next/link";

export default function Breadcrumbs({
  trail,
}: {
  trail: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-widest text-muted">
      <ol className="flex flex-wrap items-center">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={item.label + index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-forest hover:opacity-70 transition-opacity">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}