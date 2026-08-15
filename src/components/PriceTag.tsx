export type PriceTagProps = {
  amountInr: number;
  compareAt?: number;
  size?: "sm" | "md" | "lg";
};

const SIZES: Record<NonNullable<PriceTagProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const formatINR = (amountInr: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);

export default function PriceTag({ amountInr, compareAt, size = "md" }: PriceTagProps) {
  return (
    <span className={`inline-flex items-baseline gap-2 font-sans font-medium ${SIZES[size]}`}>
      {compareAt !== undefined && compareAt > amountInr && (
        <small className="text-muted line-through">{formatINR(compareAt)}</small>
      )}
      <span>{formatINR(amountInr)}</span>
    </span>
  );
}