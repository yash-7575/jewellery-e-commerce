import Button from "./Button";

export default function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h2 className="font-serif text-2xl text-forest">{title}</h2>
      {body && <p className="mt-3 font-sans text-sm text-muted leading-relaxed">{body}</p>}
      {cta && (
        <div className="mt-6">
          <Button variant="primary" href={cta.href}>
            {cta.label}
          </Button>
        </div>
      )}
    </div>
  );
}