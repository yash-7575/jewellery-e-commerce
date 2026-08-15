const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function json(status: number, body: unknown): ApiResponse {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify(body),
  };
}

export function error(
  status: number,
  code: string,
  message: string,
  field?: string | null
): ApiResponse {
  return json(status, { error: { code, message, field: field ?? null } });
}

export function noContent(): ApiResponse {
  return {
    statusCode: 204,
    headers: CORS,
    body: "",
  };
}

export function options(): ApiResponse {
  return {
    statusCode: 200,
    headers: CORS,
    body: "OK",
  };
}