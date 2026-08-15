export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string`, field);
  }
  return value.trim();
}

export function requireNumber(value: unknown, field: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new ValidationError(`${field} must be a valid number`, field);
  }
  return n;
}

export function requireEnum(
  value: unknown,
  allowed: readonly string[],
  field: string
): string {
  const s = String(value ?? "");
  if (!allowed.includes(s)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(", ")}`, field);
  }
  return s;
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

export function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export class ValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}