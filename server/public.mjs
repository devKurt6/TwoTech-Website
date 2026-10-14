import { z } from "zod";
import { BOOKABLE } from "../src/data/services.js";
import { defaults } from "../src/data/settings.js";
import {
  json,
  publicHeaders,
  body,
  csrf,
  rateLimit,
  orderSchema,
  messageSchema,
  quoteSchema,
  requestBase,
  date,
  honeypot,
  uuid,
  fail,
} from "./core.mjs";
const publicProductColumns =
  "id,name,category,price,stock,description,specs,image_url,visible,created_at,updated_at";
const bookingSchema = z
  .object({
    ...requestBase,
    service: z.string().max(200),
    device: z.string().trim().min(1).max(500),
    problem: z.string().trim().min(10).max(5000),
    preferred_date: date,
    preferred_time: z.enum([
      "9:00 AM",
      "11:00 AM",
      "1:00 PM",
      "3:00 PM",
      "5:00 PM",
    ]),
    mode: z.enum(["Drop-off", "Onsite", "Remote"]),
    address: z.string().trim().max(1000).optional().default(""),
    ...honeypot,
  })
  .refine(
    (f) => BOOKABLE.some((s) => s.n === f.service && s.modes.includes(f.mode)),
    { path: ["mode"], message: "Choose a valid service and supported mode." },
  )
  .refine((f) => f.mode !== "Onsite" || f.address.length >= 8, {
    path: ["address"],
    message: "Enter a full onsite address.",
  })
  .refine(
    (f) =>
      f.preferred_date >=
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    { path: ["preferred_date"], message: "Choose today or a later date." },
  );
export function publicSettings(data) {
  return Object.fromEntries(
    Object.keys(defaults).map((key) => [key, data?.[key] ?? defaults[key]]),
  );
}
export async function publicHandler(req, path, db, ip) {
  const url = new URL(req.url),
    method = req.method;
  if (method === "GET" && path === "/products") {
    const input = z
      .object({
        q: z.string().max(150).optional(),
        category: z.string().max(100).optional(),
        maxPrice: z.coerce.number().finite().min(0).optional(),
        sort: z.enum(["featured", "lo", "hi"]).optional(),
      })
      .safeParse(Object.fromEntries(url.searchParams));
    if (!input.success) fail(400, "VALIDATION", "Check the product filters.");
    const filters = input.data,
      params = [];
    let where = "visible=true";
    if (filters.q) {
      params.push("%" + filters.q + "%");
      where += ` and name ilike $${params.length}`;
    }
    if (filters.category) {
      params.push(filters.category);
      where += ` and category=$${params.length}`;
    }
    if (filters.maxPrice !== undefined) {
      params.push(filters.maxPrice);
      where += ` and price<=$${params.length}`;
    }
    const sort = {
      lo: "price asc",
      hi: "price desc",
      featured: "created_at asc",
    }[filters.sort || "featured"];
    const { rows } = await db.query(
      `select ${publicProductColumns} from public.products where ${where} order by ${sort} limit 1000`,
      params,
    );
    return json(
      rows,
      200,
      url.searchParams.has("_fresh")
        ? { "Cache-Control": "no-store" }
        : publicHeaders,
    );
  }
  if (method === "GET" && path.startsWith("/products/")) {
    const id = uuid.safeParse(path.split("/")[2]);
    if (!id.success) fail(404, "NOT_FOUND", "Product not found.");
    const { rows } = await db.query(
      `select ${publicProductColumns} from public.products where id=$1 and visible=true`,
      [id.data],
    );
    if (!rows[0]) fail(404, "NOT_FOUND", "Product not found.");
    return json(rows[0], 200, publicHeaders);
  }
  if (method === "GET" && path === "/settings") {
    const { rows } = await db.query(
      "select data from public.settings where id=1",
    );
    return json(
      publicSettings(rows[0]?.data),
      200,
      url.searchParams.has("_fresh")
        ? { "Cache-Control": "no-store" }
        : publicHeaders,
    );
  }
  if (method === "POST" && path === "/orders") {
    csrf(req);
    const input = await body(req, orderSchema);
    await rateLimit(db, ip, "orders");
    const { rows } = await db.transaction(
      "select public.place_order($1::jsonb,$2::jsonb) result",
      [JSON.stringify(input.customer), JSON.stringify(input.items)],
    );
    return json(rows[0].result, 201);
  }
  const kind = path.slice(1),
    schemas = {
      bookings: bookingSchema,
      quotes: quoteSchema,
      messages: messageSchema,
    };
  if (method === "POST" && schemas[kind]) {
    csrf(req);
    const f = await body(req, schemas[kind]);
    await rateLimit(db, ip, "requests");
    const columns = {
      bookings: [
        "name",
        "email",
        "phone",
        "service",
        "device",
        "problem",
        "preferred_date",
        "preferred_time",
        "mode",
        "address",
      ],
      quotes: [
        "name",
        "email",
        "phone",
        "category",
        "title",
        "requirements",
        "hardware",
        "budget",
        "target_date",
        "reference_link",
      ],
      messages: ["name", "email", "body"],
    }[kind];
    const values = columns.map((k) =>
      f[k] === "" && ["target_date", "reference_link", "address"].includes(k)
        ? null
        : f[k],
    );
    const { rows } = await db.query(
      `insert into public.${kind}(${columns.join(",")}) values(${columns.map((_, i) => "$" + (i + 1)).join(",")}) returning ref`,
      values,
    );
    return json({ ref: rows[0].ref }, 201);
  }
  fail(404, "NOT_FOUND", "API endpoint not found.");
}
