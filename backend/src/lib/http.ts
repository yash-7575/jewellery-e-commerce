type Event = {
  routeKey?: string;
  rawPath?: string;
  httpMethod?: string;
  pathParameters?: Record<string, string> | null;
  queryStringParameters?: Record<string, string> | null;
  body?: string | null;
  headers?: Record<string, string> | null;
  isBase64Encoded?: boolean;
};

export function methodOf(event: Event): string {
  return event?.routeKey?.split(" ")[0] || event?.httpMethod || "GET";
}

export function requestPath(event: Event): string {
  const rawPath = event?.rawPath || "";
  if (rawPath) {
    const idx = rawPath.indexOf("/v1");
    if (idx >= 0) return rawPath.slice(idx);
  }
  return event?.routeKey?.split(" ")[1] || "";
}

export function pathParams(event: Event): Record<string, string> {
  return event?.pathParameters || {};
}

export function queryParams(event: Event): Record<string, string> {
  return event?.queryStringParameters || {};
}

export function parseBody<T = Record<string, unknown>>(event: Event): T {
  if (!event?.body) return {} as T;
  if (event.isBase64Encoded) {
    const buf = Buffer.from(event.body, "base64").toString("utf-8");
    return JSON.parse(buf || "{}") as T;
  }
  return JSON.parse(event.body || "{}") as T;
}

export function corsOkay(event: Event): boolean {
  return !event?.headers || event.headers["origin"] === undefined;
}