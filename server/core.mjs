import { z } from "zod";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}
export const fail = (status, code, message) => {
  throw new ApiError(status, code, message);
};
export const cookieName = "__Host-tt_session";
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "X-Robots-Tag": "noindex, nofollow",
      ...headers,
    },
  });
export const publicHeaders = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};
export function csrf(req) {
  if (
    req.headers.get("origin") !== new URL(req.url).origin ||
    req.headers.get("x-requested-with") !== "TwoTech" ||
    req.headers.get("content-type")?.split(";")[0].trim() !== "application/json"
  )
    fail(403, "CSRF", "Please reload the page and try again.");
}
export async function body(req, schema) {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > 32768)
    fail(
      413,
      "TOO_LARGE",
      "This request is too large. Please shorten the text.",
    );
  let raw;
  try {
    raw = await req.text();
  } catch {
    fail(400, "INVALID_JSON", "Send a valid JSON request.");
  }
  if (Buffer.byteLength(raw) > 32768)
    fail(
      413,
      "TOO_LARGE",
      "This request is too large. Please shorten the text.",
    );
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail(400, "INVALID_JSON", "Send a valid JSON request.");
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const fields = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      fields[key] ??= issue.message;
    }
    throw new ApiError(
      400,
      "VALIDATION",
      "Please check the form fields and try again.",
      fields,
    );
  }
  if (parsed.data.website)
    fail(400, "SPAM", "This request could not be accepted.");
  return parsed.data;
}
export const uuid = z.string().uuid();
const text = (min, max) => z.string().trim().min(min).max(max);
export const email = text(3, 254)
  .email()
  .transform((v) => v.toLowerCase());
const phone = z
  .string()
  .max(32)
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+63|0)9\d{9}$/.test(v), "Enter a PH mobile number.");
export const honeypot = { website: z.string().max(500).optional().default("") };
export const customer = z
  .object({
    name: text(1, 150),
    email,
    phone,
    delivery_method: z.enum(["pickup", "delivery"]),
    address: z.string().trim().max(1000).optional().default(""),
    payment_method: z.enum(["cash", "manual_transfer"]),
    request_id: uuid,
  })
  .refine((f) => f.delivery_method !== "delivery" || f.address.length >= 8, {
    path: ["address"],
    message: "Enter a full delivery address.",
  });
export const orderSchema = z.object({
  customer,
  items: z
    .array(z.object({ productId: uuid, qty: z.number().int().min(1).max(999) }))
    .min(1)
    .max(100),
  ...honeypot,
});
export const requestBase = { name: text(1, 150), email, phone };
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Choose a valid date.",
  );
const optionalDate = z
  .union([date, z.literal("")])
  .optional()
  .default("");
export const quoteSchema = z.object({
  ...requestBase,
  category: z.enum([
    "Website",
    "Desktop Application",
    "Automation",
    "AI/Image Processing",
    "Embedded Systems/IoT",
    "Other",
  ]),
  title: text(1, 200),
  requirements: text(20, 10000),
  hardware: z.string().max(5000).optional().default(""),
  budget: text(1, 150),
  target_date: optionalDate,
  reference_link: z
    .union([
      z
        .string()
        .url()
        .max(2000)
        .refine((v) => /^https?:\/\//.test(v), "Use an HTTP or HTTPS link."),
      z.literal(""),
    ])
    .optional()
    .default(""),
  ...honeypot,
});
export const messageSchema = z.object({
  name: text(1, 150),
  email,
  body: text(10, 5000),
  ...honeypot,
});
export function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || Buffer.byteLength(value) < 32)
    throw new Error("Session secret is not configured");
  return new TextEncoder().encode(value);
}
export async function sessionToken(user) {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("two-tech")
    .setAudience("two-tech-admin")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}
export const sessionCookie = (token, maxAge = 28800) =>
  `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
export async function requireAdmin(req, db) {
  const token = (req.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  if (!token)
    fail(
      401,
      "SESSION_EXPIRED",
      "Your session has expired. Please sign in again.",
    );
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "two-tech",
      audience: "two-tech-admin",
    }));
  } catch {
    fail(
      401,
      "SESSION_EXPIRED",
      "Your session has expired. Please sign in again.",
    );
  }
  if (!uuid.safeParse(payload.sub).success)
    fail(401, "SESSION_EXPIRED", "Please sign in again.");
  const { rows } = await db.query(
    "select id,email from public.admin_users where id=$1",
    [payload.sub],
  );
  if (!rows[0])
    fail(
      401,
      "SESSION_EXPIRED",
      "Your session has expired. Please sign in again.",
    );
  return rows[0];
}
export async function rateLimit(db, ip, scope, max = 10) {
  const key = createHash("sha256")
    .update(scope + ":" + ip)
    .digest("hex");
  const { rows } = await db.query(
    "select public.consume_limit($1,$2) allowed",
    [key, max],
  );
  if (!rows[0]?.allowed)
    fail(
      429,
      "RATE_LIMIT",
      "Too many requests. Please wait a minute and try again.",
    );
}
export function errorResponse(error) {
  if (error instanceof ApiError)
    return json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      },
      error.status,
    );
  if (error.code === "P0001") {
    const message = String(error.message);
    if (/Insufficient stock/.test(message))
      return json(
        {
          error: {
            code: "STOCK_CHANGED",
            message:
              "There is not enough stock. Refresh your cart and try again.",
          },
        },
        409,
      );
    if (/no longer available/.test(message))
      return json(
        {
          error: {
            code: "UNAVAILABLE",
            message: "A product is no longer available. Refresh your cart.",
          },
        },
        409,
      );
    return json(
      {
        error: {
          code: "INVALID_ORDER",
          message:
            "The request could not be completed. Check the details and try again.",
        },
      },
      400,
    );
  }
  if (error.code === "23505")
    return json(
      {
        error: {
          code: "CONFLICT",
          message: "This record already exists. Refresh and try again.",
        },
      },
      409,
    );
  if (["23514", "22P02", "22003", "23502"].includes(error.code))
    return json(
      {
        error: {
          code: "VALIDATION",
          message: "Please check the form fields and try again.",
        },
      },
      400,
    );
  return json(
    {
      error: {
        code: "SERVER_UNAVAILABLE",
        message:
          "The server is unavailable or waking up. Please try again in a moment.",
      },
    },
    503,
  );
}
