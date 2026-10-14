// @vitest-environment node
import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { createHandler } from "../app.mjs";
import { createAdminHandler } from "../admin.mjs";
import { sessionToken, cookieName } from "../core.mjs";
import { defaults } from "../../src/data/settings.js";
let pg, handler, cookie;
const origin = "https://twotech.example";
const user = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "fixture@example.ph",
};
beforeAll(async () => {
  process.env.JWT_SECRET = crypto.randomUUID() + crypto.randomUUID();
  pg = new PGlite();
  for (const f of fs.readdirSync("db/migrations").sort())
    await pg.exec(fs.readFileSync("db/migrations/" + f, "utf8"));
  await pg.exec(fs.readFileSync("db/seed.sql", "utf8"));
  await pg.query(
    "insert into admin_users(id,email,password_hash) values($1,$2,$3)",
    [user.id, user.email, await bcrypt.hash("Fixture password only 123", 4)],
  );
  handler = createHandler({
    db: {
      query: (...a) => pg.query(...a),
      transaction: (...a) => pg.query(...a),
    },
    adminHandler: createAdminHandler(),
  });
  cookie = cookieName + "=" + (await sessionToken(user));
}, 20000);
afterAll(async () => pg?.close());
function req(path, { method = "GET", data, auth = false, csrf = true } = {}) {
  return new Request(origin + "/api/admin" + path, {
    method,
    headers: {
      ...(auth ? { cookie } : {}),
      ...(csrf
        ? {
            origin,
            "x-requested-with": "TwoTech",
            "content-type": "application/json",
          }
        : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
}
it("protects every admin endpoint and unknown admin paths with 401", async () => {
  const routes = [
    ["/me", "GET"],
    ["/logout", "POST"],
    ["/products", "GET"],
    ["/products", "POST"],
    ["/products/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "PATCH"],
    ["/products/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "DELETE"],
    ["/upload-signature", "POST"],
    ["/images", "DELETE"],
    ["/settings", "GET"],
    ["/settings", "PUT"],
    ["/inbox?type=orders", "GET"],
    ["/inbox/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "PATCH"],
    ["/dashboard", "GET"],
    ["/anything", "POST"],
  ];
  for (const [path, method] of routes) {
    const response = await handler(
      req(path, { method, ...(method !== "GET" ? { data: {} } : {}) }),
    );
    expect(response.status, path).toBe(401);
  }
});
it("rejects admin mutations without CSRF header or with a foreign origin", async () => {
  for (const path of [
    "/logout",
    "/products",
    "/upload-signature",
    "/settings",
    "/inbox/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "/images",
  ]) {
    const method =
      path === "/settings"
        ? "PUT"
        : path === "/images"
          ? "DELETE"
          : path.startsWith("/inbox")
            ? "PATCH"
            : "POST";
    expect(
      (await handler(req(path, { method, data: {}, auth: true, csrf: false })))
        .status,
    ).toBe(403);
    const request = req(path, { method, data: {}, auth: true });
    request.headers.set("origin", "https://attacker.example");
    expect((await handler(request)).status).toBe(403);
  }
});
it("issues a short secure HttpOnly Strict cookie and excludes password hashes", async () => {
  const response = await handler(
    req("/login", {
      method: "POST",
      data: { email: user.email, password: "Fixture password only 123" },
    }),
    { ip: "successful-login" },
  );
  expect(response.status).toBe(200);
  const c = response.headers.get("set-cookie");
  for (const attr of [
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=28800",
    "Path=/",
  ])
    expect(c).toContain(attr);
  expect(await response.text()).not.toMatch(/password|hash|secret|token/i);
  const me = await handler(req("/me", { auth: true }));
  expect(await me.json()).toEqual(user);
});
it("throttles repeated failures with generic errors", async () => {
  for (let i = 0; i < 6; i++) {
    const response = await handler(
      req("/login", {
        method: "POST",
        data: { email: "missing@example.ph", password: "incorrect fixture" },
      }),
      { ip: "repeated-failures" },
    );
    expect(response.status).toBe(i < 5 ? 401 : 429);
    expect((await response.json()).error.message).toBe(
      "Invalid email or password",
    );
  }
}, 15000);
it("rejects a forged token and revoked administrator", async () => {
  const fake = req("/me", { auth: true });
  fake.headers.set("cookie", cookieName + "=forged");
  expect((await handler(fake)).status).toBe(401);
  const removed = { id: crypto.randomUUID(), email: "removed@example.ph" },
    token = await sessionToken(removed),
    r = req("/me");
  r.headers.set("cookie", cookieName + "=" + token);
  expect((await handler(r)).status).toBe(401);
});
it("rejects unknown write fields instead of changing protected data", async () => {
  const response = await handler(
    req("/inbox/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", {
      method: "PATCH",
      auth: true,
      data: { status: "paid", total: 1 },
    }),
  );
  expect(response.status).toBe(400);
  expect(await response.text()).not.toMatch(
    /password_hash|postgres:\/\/|stack/,
  );
});
it("returns safe projections from authenticated read endpoints", async () => {
  for (const path of [
    "/me",
    "/products",
    "/settings",
    "/dashboard",
    "/inbox?type=orders",
    "/inbox?type=bookings",
    "/inbox?type=quotes",
    "/inbox?type=messages",
  ]) {
    const response = await handler(req(path, { auth: true }));
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toMatch(
      /password_hash|\$2[aby]\$|postgres:\/\/|JWT_SECRET|CLOUDINARY_API_SECRET/,
    );
  }
});
it("creates, updates, hides and deletes products with real SQL", async () => {
  const payload = {
    name: "Fixture RAM",
    category: "RAM",
    price: 1000.25,
    stock: 3,
    description: "Test fixture",
    specs: "DDR4",
    visible: false,
    image_url: null,
    image_public_id: null,
  };
  const created = await handler(
    req("/products", { method: "POST", auth: true, data: payload }),
  );
  expect(created.status).toBe(201);
  const product = await created.json();
  expect(Number(product.price)).toBe(1000.25);
  const edited = await handler(
    req("/products/" + product.id, {
      method: "PATCH",
      auth: true,
      data: { ...payload, price: 1200, stock: 2 },
    }),
  );
  expect(edited.status).toBe(200);
  expect(Number((await edited.json()).price)).toBe(1200);
  const removed = await handler(
    req("/products/" + product.id, { method: "DELETE", auth: true, data: {} }),
  );
  expect(removed.status).toBe(200);
  expect(
    (await pg.query("select id from products where id=$1", [product.id])).rows,
  ).toHaveLength(0);
});
it("updates settings and inbox notes with validated defaults", async () => {
  const response = await handler(
    req("/settings", {
      method: "PUT",
      auth: true,
      data: { ...defaults, banner: "Fixture announcement" },
    }),
  );
  expect(response.status).toBe(200);
  expect(
    (await pg.query("select data from settings where id=1")).rows[0].data
      .banner,
  ).toBe("Fixture announcement");
  const { rows } = await pg.query(
    "insert into messages(name,email,body) values('Fixture','fixture@example.ph','A fixture inquiry message') returning id",
  );
  const changed = await handler(
    req("/inbox/messages/" + rows[0].id, {
      method: "PATCH",
      auth: true,
      data: { handled: true, admin_notes: "Reviewed" },
    }),
  );
  expect(changed.status).toBe(200);
  expect(
    (
      await pg.query("select handled,admin_notes from messages where id=$1", [
        rows[0].id,
      ])
    ).rows[0],
  ).toEqual({ handled: true, admin_notes: "Reviewed" });
});
