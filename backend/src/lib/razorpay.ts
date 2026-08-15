import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

let razorpayClient: any = null;
let cachedKeys: { key_id: string; key_secret: string } | null = null;
let keysPromise: Promise<{ key_id: string; key_secret: string }> | null = null;

const SECRET_NAME = () =>
  process.env.RAZORPAY_SECRET_NAME || process.env.RAZORPAY_SECRETS_ARN || "aaranya/razorpay";

async function fetchKeys(): Promise<{ key_id: string; key_secret: string }> {
  if (cachedKeys) return cachedKeys;
  const sm = new SecretsManagerClient({ region: process.env.AWS_REGION || "ap-south-1" });
  const secret = SECRET_NAME();
  const out = await sm.send(new GetSecretValueCommand({ SecretId: secret }));
  const parsed = JSON.parse(out.SecretString || "{}");
  cachedKeys = {
    key_id: parsed.RAZORPAY_KEY_ID || parsed.key_id,
    key_secret: parsed.RAZORPAY_KEY_SECRET || parsed.key_secret,
  };
  return cachedKeys;
}

export function getKeys(): Promise<{ key_id: string; key_secret: string }> {
  keysPromise = keysPromise || fetchKeys();
  return keysPromise;
}

export async function getRazorpayClient(): Promise<any> {
  if (razorpayClient) return razorpayClient;
  const { key_id, key_secret } = await getKeys();
  const Razorpay = (await import("razorpay")).default;
  razorpayClient = new Razorpay({ key_id, key_secret });
  return razorpayClient;
}