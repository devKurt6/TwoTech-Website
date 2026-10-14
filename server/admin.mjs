import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { CATS } from "../src/data/products.js";
import {
  json,
  body,
  csrf,
  fail,
  requireAdmin,
  email,
  uuid,
  sessionToken,
  sessionCookie,
  rateLimit,
} from "./core.mjs";
import { publicSettings } from "./public.mjs";
const note = z.string().max(5000).nullable().optional();
const statuses = {
  orders: [
    "new",
    "awaiting_payment",
    "paid",
    "processing",
    "ready",
    "completed",
    "cancelled",
  ],
  bookings: ["pending", "confirmed", "done", "cancelled"],
  quotes: ["pending", "reviewing", "quoted", "closed"],
};
const productSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    category: z.enum(CATS),
    price: z
      .number()
      .positive()
      .max(99999999.99)
      .refine(
        (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-5,
        "Use at most two decimal places.",
      ),
    stock: z.number().int().min(0).max(2147483647),
    description: z.string().max(5000).default(""),
    specs: z.string().max(5000).default(""),
    image_url: z.string().url().max(2000).nullable().default(null),
    image_public_id: z.string().max(300).nullable().default(null),
    visible: z.boolean(),
  })
  .strict()
  .refine((p) => Boolean(p.image_url) === Boolean(p.image_public_id), {
    path: ["image_url"],
    message: "Upload the image again.",
  });
const settingsSchema = z
  .object({
    headline: z.string().trim().min(1).max(5000),
    banner: z.string().max(5000),
    phone: z
      .string()
      .regex(/^(\+63|0)9[0-9]{9}$/)
      .or(z.literal("+63 963 310 2486")),
    email,
    address: z.string().trim().min(1).max(1000),
    hours: z.string().trim().min(1).max(500),
    facebook: z
      .string()
      .url()
      .refine((v) => {
        const u = new URL(v);
        return (
          u.protocol === "https:" && /(^|\.)facebook\.com$/.test(u.hostname)
        );
      }, "Use an HTTPS Facebook URL."),
    delivery_fee: z.number().min(0).max(999999),
    payment_instructions: z.string().trim().min(1).max(5000),
    founder_bio: z.string().trim().min(1).max(5000),
    low_stock_threshold: z.number().int().min(0).max(100000),
  })
  .strict();
// Random dummy hash keeps unknown-email verification on the same bcrypt path.
const dummyHash = bcrypt.hashSync(randomBytes(24).toString("hex"), 12);
async function removeUnusedImage(db, images, id) {
  const { rows } = await db.query(
    "select id from public.products where image_public_id=$1 limit 1",
    [id],
  );
  if (!rows.length) await images.destroy(id);
}
export function createAdminHandler({
  images = {
    verify: async () => {},
    destroy: async () => {},
    signature: async () => {
      fail(
        503,
        "IMAGES_UNAVAILABLE",
        "Configure image hosting before uploading.",
      );
    },
  },
} = {}) {
  return async (req, path, db, ip) => {
    const method = req.method,
      segments = path.split("/").filter(Boolean);
    if (path === "/admin/login" && method === "POST") {
      csrf(req);
      const f = await body(
        req,
        z.object({
          email,
          password: z
            .string()
            .min(1)
            .max(128)
            .refine((v) => Buffer.byteLength(v) <= 72, "Password is too long."),
        }),
      );
      const reservation = await db.query(
        "select public.reserve_login($1,$2) allowed",
        [f.email, ip],
      );
      if (!reservation.rows[0]?.allowed)
        fail(429, "INVALID_CREDENTIALS", "Invalid email or password");
      const { rows } = await db.query(
        "select id,email,password_hash from public.admin_users where email=$1",
        [f.email],
      );
      const found = rows[0],
        valid = await bcrypt.compare(
          f.password,
          found?.password_hash || dummyHash,
        );
      if (!found || !valid)
        fail(401, "INVALID_CREDENTIALS", "Invalid email or password");
      await db.query(
        "delete from public.login_attempts where email=$1 and ip=$2",
        [f.email, ip],
      );
      const token = await sessionToken(found);
      return json({ id: found.id, email: found.email }, 200, {
        "Set-Cookie": sessionCookie(token),
      });
    }
    const user = await requireAdmin(req, db);
    if (!["GET", "HEAD"].includes(method)) csrf(req);
    if (path === "/admin/me" && method === "GET") return json(user);
    if (path === "/admin/logout" && method === "POST") {
      await body(req, z.object({}).strict());
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
    }
    if (path === "/admin/products" && method === "GET")
      return json(
        (
          await db.query(
            "select * from public.products order by created_at desc",
          )
        ).rows,
      );
    if (
      segments[1] === "products" &&
      ["POST", "PATCH", "DELETE"].includes(method)
    ) {
      const id = segments[2];
      if (method === "POST" && segments.length !== 2)
        fail(404, "NOT_FOUND", "Endpoint not found.");
      if (
        method !== "POST" &&
        (!uuid.safeParse(id).success || segments.length !== 3)
      )
        fail(400, "VALIDATION", "Choose a valid product.");
      let existing;
      if (id) {
        existing = (
          await db.query("select * from public.products where id=$1", [id])
        ).rows[0];
        if (!existing) fail(404, "NOT_FOUND", "Product not found.");
      }
      if (method === "DELETE") {
        await body(req, z.object({}).strict());
        await db.query("delete from public.products where id=$1", [id]);
        if (existing.image_public_id) {
          try {
            await removeUnusedImage(db, images, existing.image_public_id);
          } catch {
            /* Cleanup can be retried in Cloudinary. */
          }
        }
        return json({ ok: true });
      }
      const f = await body(req, productSchema);
      if (
        f.image_public_id &&
        (!existing ||
          existing.image_public_id !== f.image_public_id ||
          existing.image_url !== f.image_url)
      )
        await images.verify(f.image_public_id, f.image_url);
      const keys = Object.keys(f),
        values = Object.values(f);
      let saved;
      if (method === "POST")
        saved = (
          await db.query(
            `insert into public.products(${keys.join(",")}) values(${keys.map((_, i) => "$" + (i + 1)).join(",")}) returning *`,
            values,
          )
        ).rows[0];
      else
        saved = (
          await db.query(
            `update public.products set ${keys.map((k, i) => k + "=$" + (i + 1)).join(",")} where id=$${values.length + 1} returning *`,
            [...values, id],
          )
        ).rows[0];
      if (
        existing?.image_public_id &&
        existing.image_public_id !== f.image_public_id
      ) {
        try {
          await removeUnusedImage(db, images, existing.image_public_id);
        } catch {
          /* The product save succeeded; remove orphaned images in Cloudinary. */
        }
      }
      return json(saved, method === "POST" ? 201 : 200);
    }
    if (path === "/admin/settings" && method === "GET") {
      const { rows } = await db.query(
        "select data from public.settings where id=1",
      );
      return json(publicSettings(rows[0]?.data));
    }
    if (path === "/admin/settings" && method === "PUT") {
      const raw = await body(req, z.object({}).passthrough());
      if (typeof raw.phone === "string")
        raw.phone = raw.phone.replace(/[\s-]/g, "");
      const parsed = settingsSchema.safeParse(raw);
      if (!parsed.success)
        fail(
          400,
          "VALIDATION",
          "Check the website settings, contact details and numeric values.",
        );
      await db.query(
        "insert into public.settings(id,data) values(1,$1::jsonb) on conflict(id) do update set data=excluded.data",
        [JSON.stringify(parsed.data)],
      );
      return json({ ok: true });
    }
    if (path === "/admin/inbox" && method === "GET") {
      const type = new URL(req.url).searchParams.get("type");
      if (!["orders", "bookings", "quotes", "messages"].includes(type))
        fail(400, "VALIDATION", "Choose an inbox category.");
      const query =
        type === "orders"
          ? "select o.*,coalesce((select json_agg(i) from public.order_items i where i.order_id=o.id),'[]'::json) order_items from public.orders o order by created_at desc limit 1000"
          : `select * from public.${type} order by created_at desc limit 1000`;
      return json((await db.query(query)).rows);
    }
    if (segments[1] === "inbox" && method === "PATCH") {
      const [, , type, id] = segments;
      if (
        !["orders", "bookings", "quotes", "messages"].includes(type) ||
        !uuid.safeParse(id).success ||
        segments.length !== 4
      )
        fail(400, "VALIDATION", "Choose a valid inbox record.");
      const schema =
        type === "messages"
          ? z.object({ handled: z.boolean(), admin_notes: note }).strict()
          : type === "orders"
            ? z
                .object({ status: z.enum(statuses.orders), notes: note })
                .strict()
            : z
                .object({ status: z.enum(statuses[type]), admin_notes: note })
                .strict();
      const f = await body(req, schema),
        keys = Object.keys(f),
        values = Object.values(f);
      const { rows } = await db.query(
        `update public.${type} set ${keys.map((k, i) => k + "=$" + (i + 1)).join(",")} where id=$${values.length + 1} returning id`,
        [...values, id],
      );
      if (!rows.length) fail(404, "NOT_FOUND", "Record not found.");
      return json({ ok: true });
    }
    if (path === "/admin/dashboard" && method === "GET") {
      const settings = (
        await db.query("select data from public.settings where id=1")
      ).rows[0]?.data;
      const threshold = Number(settings?.low_stock_threshold ?? 5);
      const counts = (
        await db.query(
          "select (select count(*)::int from public.products where visible) listed,(select count(*)::int from public.products where stock<=$1) low_stock,(select count(*)::int from public.orders where status not in ('completed','cancelled')) orders,(select count(*)::int from public.bookings where status='pending')+(select count(*)::int from public.quotes where status='pending') pending",
          [threshold],
        )
      ).rows[0];
      const restock = (
        await db.query(
          "select id,name,stock from public.products where stock<=$1 order by stock,name",
          [threshold],
        )
      ).rows;
      return json({ ...counts, restock });
    }
    if (path === "/admin/upload-signature" && method === "POST") {
      await body(req, z.object({}).strict());
      await rateLimit(db, ip, "uploads", 6);
      return json(await images.signature());
    }
    if (path === "/admin/images" && method === "DELETE") {
      const f = await body(
        req,
        z
          .object({
            public_id: z.string().regex(/^twotech\/products\/[a-zA-Z0-9_-]+$/),
          })
          .strict(),
      );
      const linked = (
        await db.query(
          "select id from public.products where image_public_id=$1",
          [f.public_id],
        )
      ).rows;
      if (linked.length)
        fail(409, "IMAGE_LINKED", "This image is still used by a product.");
      await images.destroy(f.public_id);
      return json({ ok: true });
    }
    fail(404, "NOT_FOUND", "API endpoint not found.");
  };
}
