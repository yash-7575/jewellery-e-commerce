import { QueryCommand, GetCommand, UpdateCommand, DeleteCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { doc, TABLES } from "../lib/dynamo";
import { json, error, noContent } from "../lib/response";
import { methodOf, requestPath, pathParams, parseBody } from "../lib/http";
import { getUserId, getEmail, getName, isAdmin } from "../lib/auth";
import { requireString, requireNumber, ValidationError } from "../lib/validate";

function profileShape(u: any, userId: string) {
  return {
    userId,
    email: u.email,
    name: u.name,
    phone: u.phone || null,
    isAdmin: !!u.isAdmin,
    defaultAddressId: u.defaultAddressId || null,
    createdAt: u.createdAt,
  };
}

function addrKey(userId: string, addressId: string) {
  return { userId, sk: `ADDR-${addressId}` };
}

function addressShape(a: any) {
  return {
    addressId: a.addressId,
    label: a.label || "",
    recipient: a.recipient,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || "",
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country || "IN",
    isDefault: !!a.isDefault,
  };
}

async function getProfile(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const out = await doc.send(new GetCommand({ TableName: TABLES.users, Key: { userId, sk: "PROFILE" } }));
  if (!out.Item) return error(404, "USER_NOT_FOUND", "Profile not found.");
  const emailFromToken = getEmail(event);
  const nameFromToken = getName(event);
  const p = profileShape({ ...out.Item, email: out.Item.email || emailFromToken, name: out.Item.name || nameFromToken }, userId);
  return json(200, p);
}

async function updateProfile(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const b = parseBody(event);
  const updates: Record<string, any> = {};
  if (b.name !== undefined) {
    const name = requireString(b.name, "name");
    updates.name = name;
  }
  if (b.phone !== undefined) {
    const phone = b.phone === null ? null : requireString(b.phone, "phone");
    updates.phone = phone;
  }
  if (Object.keys(updates).length === 0) return error(400, "VALIDATION_ERROR", "Nothing to update.");
  const expr = "SET " + Object.keys(updates).map((k) => `#${k} = :${k}`).join(", ");
  const out = await doc.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { userId, sk: "PROFILE" },
      UpdateExpression: expr,
      ExpressionAttributeNames: Object.fromEntries(Object.keys(updates).map((k) => [`#${k}`, k])),
      ExpressionAttributeValues: Object.fromEntries(Object.keys(updates).map((k) => [`:${k}`, updates[k]])),
      ReturnValues: "ALL_NEW",
    })
  );
  if (!out.Attributes) return error(404, "USER_NOT_FOUND", "Profile not found.");
  return json(200, profileShape(out.Attributes, userId));
}

async function listAddresses(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLES.users,
      KeyConditionExpression: "userId = :u AND begins_with(sk, :p)",
      ExpressionAttributeValues: { ":u": userId, ":p": "ADDR-" },
    })
  );
  const items = (out.Items || []).map(addressShape);
  return json(200, { items, count: items.length });
}

async function addAddress(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const b = parseBody(event);
  try {
    requireString(b.recipient, "recipient");
    requireString(b.phone, "phone");
    requireString(b.line1, "line1");
    requireString(b.city, "city");
    requireString(b.state, "state");
    const pincode = requireString(b.pincode, "pincode");
    if (!/^\d{6}$/.test(pincode)) throw new ValidationError("pincode must be 6 digits", "pincode");
  } catch (e) {
    if (e instanceof ValidationError) return error(400, "VALIDATION_ERROR", e.message, e.field);
    throw e;
  }

  const addressId = Math.random().toString(16).slice(2, 8);
  const now = new Date().toISOString();
  const isDefault = b.isDefault === true;

  const tx: any[] = [
    {
      Put: {
        TableName: TABLES.users,
        Item: {
          userId,
          sk: `ADDR-${addressId}`,
          addressId,
          label: b.label ? String(b.label) : "",
          recipient: String(b.recipient),
          phone: String(b.phone),
          line1: String(b.line1),
          line2: b.line2 ? String(b.line2) : "",
          city: String(b.city),
          state: String(b.state),
          pincode: String(b.pincode),
          country: b.country ? String(b.country) : "IN",
          isDefault,
          createdAt: now,
        },
      },
    },
  ];
  if (isDefault) {
    const exists = await doc.send(
      new QueryCommand({
        TableName: TABLES.users,
        KeyConditionExpression: "userId = :u AND begins_with(sk, :p)",
        ExpressionAttributeValues: { ":u": userId, ":p": "ADDR-" },
      })
    );
    const curDefault = (exists.Items || []).find((a) => a.isDefault);
    if (curDefault && curDefault.addressId !== addressId) {
      tx.push({
        Update: {
          TableName: TABLES.users,
          Key: { userId, sk: `ADDR-${curDefault.addressId}` },
          UpdateExpression: "SET isDefault = :f",
          ExpressionAttributeValues: { ":f": false },
        },
      });
    }
    tx.push({
      Update: {
        TableName: TABLES.users,
        Key: { userId, sk: "PROFILE" },
        UpdateExpression: "SET defaultAddressId = :id",
        ExpressionAttributeValues: { ":id": `${addressId}` },
      },
    });
  }

  await doc.send(new TransactWriteCommand({ TransactItems: tx }));
  return json(201, addressShape({
    addressId, label: b.label ? String(b.label) : "", recipient: String(b.recipient),
    phone: String(b.phone), line1: String(b.line1), line2: b.line2 ? String(b.line2) : "",
    city: String(b.city), state: String(b.state), pincode: String(b.pincode),
    country: b.country ? String(b.country) : "IN", isDefault,
  }));
}

async function removeAddress(event: any) {
  const userId = getUserId(event);
  if (!userId) return error(401, "UNAUTHORIZED", "Authentication required.");
  const { addressId } = pathParams(event);
  if (!addressId) return error(400, "VALIDATION_ERROR", "addressId is required.", "addressId");

  const profile = await doc.send(new GetCommand({ TableName: TABLES.users, Key: { userId, sk: "PROFILE" } }));
  if (profile.Item?.defaultAddressId === addressId)
    return error(409, "ADDRESS_IS_DEFAULT", "Cannot delete the default address.");

  const del = await doc.send(new DeleteCommand({ TableName: TABLES.users, Key: addrKey(userId, addressId) }));
  if (!del.$metadata?.httpStatusCode) return error(404, "ADDRESS_NOT_FOUND", `No address exists for id '${addressId}'.`);
  return noContent();
}

export const handler = async (event: any) => {
  try {
    if (methodOf(event) === "OPTIONS") return json(200, {});
    const method = methodOf(event);
    const base = requestPath(event);

    if (base === "/v1/me" && method === "GET") return await getProfile(event);
    if (base === "/v1/me" && method === "PATCH") return await updateProfile(event);
    if (base === "/v1/me/addresses" && method === "GET") return await listAddresses(event);
    if (base === "/v1/me/addresses" && method === "POST") return await addAddress(event);

    const m = base.match(/^\/v1\/me\/addresses\/([^/]+)$/);
    if (m && method === "DELETE") return await removeAddress({ ...event, pathParameters: { addressId: m[1] } });

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (e: any) {
    console.error("user handler error", e);
    return error(500, "INTERNAL_ERROR", e?.message || "Internal server error.");
  }
};