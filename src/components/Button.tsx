import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonProps = {
  variant: "primary" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

const VARIANTS: Record<ButtonProps["variant"], string> = {
  primary: "bg-forest text-cream hover:bg-forestDark",
  ghost: "border border-forest text-forest bg-cream hover:bg-creamDark",
  link: "text-forest underline underline-offset-4",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export default function Button({
  variant,
  size = "md",
  href,
  type = "button",
  disabled,
  className = "",
  children,
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center font-sans font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}