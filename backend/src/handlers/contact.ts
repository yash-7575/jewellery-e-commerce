import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error } from "../lib/response";
import { methodOf, requestPath, parseBody } from "../lib/http";
import { requireString, ValidationError } from "../lib/validate";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (!(base === "/v1/contact" && method === "POST"))
      return error(404, "NOT_FOUND", "Route not found.");

    const b = parseBody(event);
    let name: string, email: string, message: string;
    try {
      name = requireString(b.name, "name");
      email = requireString(b.email, "email");
      if (!EMAIL_RE.test(email)) throw new ValidationError("email is not a valid email address", "email");
      message = requireString(b.message, "message");
      if (message.length < 10) throw new ValidationError("message must be at least 10 characters", "message");
    } catch (e) {
      if (e instanceof ValidationError) return error(400, "VALIDATION_ERROR", e.message, e.field);
      throw e;
    }

    const contactId = "CT-" + Math.random().toString(16).slice(2, 8);
    const now = new Date().toISOString();
    await doc.send(
      new PutCommand({
        TableName: TABLES.contact,
        Item: {
          contactId,
          sk: "META",
          name,
          email,
          phone: b.phone ? String(b.phone) : null,
          subject: b.subject ? String(b.subject) : "",
          message,
          status: "NEW",
          createdAt: now,
        },
      })
    );

    return json(202, { contactId, status: "NEW", createdAt: now });
  } catch (e: any) {
    console.error("contact handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};