interface JwtClaims {
  sub?: string;
  "cognito:groups"?: string[];
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  phone_number?: string;
}

function claims(event: { requestContext?: any }): JwtClaims | null {
  return event?.requestContext?.authorizer?.jwt?.claims ?? null;
}

export function getUserId(event: { requestContext?: any }): string | null {
  const c = claims(event);
  return c?.sub || null;
}

export function isAdmin(event: { requestContext?: any }): boolean {
  const c = claims(event);
  const groups = c?.["cognito:groups"];
  return Array.isArray(groups) && groups.includes("admin");
}

export function getEmail(event: { requestContext?: any }): string | null {
  const c = claims(event);
  return c?.email || c?.email_verified === true ? c?.email || null : null;
}

export function getName(event: { requestContext?: any }): string | null {
  const c = claims(event);
  return c?.name || null;
}