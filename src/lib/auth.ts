import { useCallback, useEffect, useState } from "react";

const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION || "ap-south-1";
const USER_POOL_ID =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "ap-south-1_RycmYFmKc";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "41ted5cpii690adcesq34r3dd8";
const COGNITO_ENDPOINT = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

const ID_TOKEN_KEY = "aaranya_id_token";
const REFRESH_TOKEN_KEY = "aaranya_refresh_token";
const ACCESS_TOKEN_KEY = "aaranya_access_token";

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  tokenExpiresAt?: number;
}

export interface CodeDeliveryDetails {
  destination?: string;
  deliveryMedium?: string;
  attributeName?: string;
}

export class AuthError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

const readStorage = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable — session continues without persistence
  }
};

const removeStorage = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
};

const setTokens = (idToken: string, refreshToken: string): void => {
  writeStorage(ID_TOKEN_KEY, idToken);
  writeStorage(ACCESS_TOKEN_KEY, idToken);
  if (refreshToken) writeStorage(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = (): void => {
  removeStorage(ID_TOKEN_KEY);
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
};

export function getIdToken(): string | null {
  return readStorage(ID_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_KEY);
}

export function signOut(): void {
  clearTokens();
}

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_HINT =
  "At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.";

const decodeJwt = (token: string): Record<string, unknown> | null => {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const encoded = binary
      .split("")
      .map((character) => "%" + `00${character.charCodeAt(0).toString(16)}`.slice(-2))
      .join("");
    return JSON.parse(decodeURIComponent(encoded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export function parseIdToken(token: string): AuthUser | null {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.sub !== "string") return null;
  return {
    userId: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
    name: typeof payload.name === "string" ? payload.name : undefined,
    emailVerified:
      typeof payload.email_verified === "boolean" ? payload.email_verified : undefined,
    tokenExpiresAt: typeof payload.exp === "number" ? payload.exp * 1000 : undefined,
  };
}

const isCognitoError = (value: unknown): value is { __type?: unknown; message?: unknown } =>
  typeof value === "object" && value !== null;

async function cognitoPost<T>(target: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": target,
    },
    body: JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const code =
      isCognitoError(data) && typeof data.__type === "string"
        ? (data.__type.split("#").pop() ?? "COGNITO_ERROR")
        : "COGNITO_ERROR";
    const message =
      isCognitoError(data) && typeof data.message === "string"
        ? data.message
        : `Cognito request failed (${response.status})`;
    throw new AuthError(code, message);
  }
  return data as T;
}

const normalizedUsername = (email: string): string => email.trim().toLowerCase();

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface SignUpResult {
  userSub?: string;
  codeDeliveryDetails?: CodeDeliveryDetails;
}

export async function signUp({ email, password, name }: SignUpInput): Promise<SignUpResult> {
  const data = await cognitoPost<{
    UserSub?: string;
    CodeDeliveryDetails?: CodeDeliveryDetails;
  }>("AWSCognitoIdentityProviderService.SignUp", {
    ClientId: CLIENT_ID,
    Username: normalizedUsername(email),
    Password: password,
    UserAttributes: [
      { Name: "email", Value: normalizedUsername(email) },
      { Name: "name", Value: name.trim() },
    ],
  });
  return {
    userSub: data.UserSub,
    codeDeliveryDetails: data.CodeDeliveryDetails,
  };
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await cognitoPost("AWSCognitoIdentityProviderService.ConfirmSignUp", {
    ClientId: CLIENT_ID,
    Username: normalizedUsername(email),
    ConfirmationCode: code.trim(),
  });
}

export async function resendConfirmationCode(
  email: string,
): Promise<CodeDeliveryDetails | undefined> {
  const data = await cognitoPost<{ CodeDeliveryDetails?: CodeDeliveryDetails }>(
    "AWSCognitoIdentityProviderService.ResendConfirmationCode",
    { ClientId: CLIENT_ID, Username: normalizedUsername(email) },
  );
  return data.CodeDeliveryDetails;
}

export async function forgotPassword(
  email: string,
): Promise<CodeDeliveryDetails | undefined> {
  const data = await cognitoPost<{ CodeDeliveryDetails?: CodeDeliveryDetails }>(
    "AWSCognitoIdentityProviderService.ForgotPassword",
    { ClientId: CLIENT_ID, Username: normalizedUsername(email) },
  );
  return data.CodeDeliveryDetails;
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await cognitoPost("AWSCognitoIdentityProviderService.ConfirmForgotPassword", {
    ClientId: CLIENT_ID,
    Username: normalizedUsername(email),
    ConfirmationCode: code.trim(),
    Password: newPassword,
  });
}

async function doSignIn(email: string, password: string): Promise<AuthUser> {
  const data = await cognitoPost<{
    AuthenticationResult?: {
      AccessToken?: string;
      ExpiresIn?: number;
      IdToken?: string;
      RefreshToken?: string;
      TokenType?: string;
    };
    ChallengeName?: string;
  }>("AWSCognitoIdentityProviderService.InitiateAuth", {
    ClientId: CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: normalizedUsername(email),
      PASSWORD: password,
    },
  });
  const result = data.AuthenticationResult;
  if (!result || !result.IdToken) {
    throw new AuthError(
      data.ChallengeName ?? "AUTH_CHALLENGE",
      "Additional confirmation is required to sign in.",
    );
  }
  setTokens(result.IdToken, result.RefreshToken ?? "");
  const user = parseIdToken(result.IdToken);
  if (!user) throw new AuthError("INVALID_TOKEN", "We could not parse your session.");
  return user;
}

export { doSignIn as signIn };

let pendingRefresh: Promise<string | null> | null = null;

export async function refreshTokens(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const data = await cognitoPost<{
      AuthenticationResult?: { AccessToken?: string; IdToken?: string; TokenType?: string };
    }>("AWSCognitoIdentityProviderService.InitiateAuth", {
      ClientId: CLIENT_ID,
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });
    const idToken = data.AuthenticationResult?.IdToken;
    if (!idToken) return null;
    setTokens(idToken, refreshToken);
    return idToken;
  } catch {
    clearTokens();
    return null;
  }
}

const refreshTokensOnce = (): Promise<string | null> => {
  if (!pendingRefresh) {
    pendingRefresh = refreshTokens().finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
};

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response = await fetch(url, { ...init, headers });
  if (response.status === 401 && token) {
    const fresh = await refreshTokensOnce();
    if (fresh) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${fresh}`);
      response = await fetch(url, { ...init, headers: retryHeaders });
    }
  }
  return response;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function getJsonAuth<T>(path: string): Promise<T> {
  const response = await fetchWithAuth(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`AARANYA API ${path} responded ${response.status}`);
  }
  return (await response.json()) as T;
}

export interface UseAuthResult {
  user: AuthUser | null;
  idToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const read = () => {
      const token = getIdToken();
      setIdToken(token);
      setUser(token ? parseIdToken(token) : null);
    };
    read();
    setLoading(false);
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === ID_TOKEN_KEY || event.key === ACCESS_TOKEN_KEY) {
        read();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const parsed = await doSignIn(email, password);
    setIdToken(getIdToken());
    setUser(parsed);
    return parsed;
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
    setIdToken(null);
  }, []);

  return { user, idToken, loading, signIn, signOut };
}