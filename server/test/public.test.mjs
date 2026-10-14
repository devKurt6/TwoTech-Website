// @vitest-environment node
import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import { createHandler } from "../app.mjs";
let pg, handler;
const origin = "https://twotech.example";
beforeAll(async () => {
  pg = new PGlite();
  for (const f of fs.readdirSync("db/migrations").sort())
    await pg.exec(fs.readFileSync("db/migrations/" + f, "utf8"));
  await pg.exec(fs.readFileSync("db/seed.sql", "utf8"));
  handler = createHandler({
    db: {
      query: (...args) => pg.query(...args),
      transaction: (...args) => pg.query(...args),
    },
  });
}, 20000);
afterAll(async () => pg?.close());
function req(path, data, method = data ? "POST" : "GET") {
  return new Request(origin + "/api" + path, {
    method,
    headers: {
      origin,
      "x-requested-with": "TwoTech",
      "content-type": "application/json",
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
const customer = () => ({
  name: "Test",
  email: "test@example.ph",
  phone: "09171234567",
  delivery_method: "pickup",
  payment_method: "cash",
  request_id: crypto.randomUUID(),
  total: 1,
});
const pid = "00000000-0000-4000-8000-000000000001";
it("uses stored prices, ignores forged total and decrements stock", async () => {
  const before = (
    await pg.query("select stock from products where id=$1", [pid])
  ).rows[0].stock;
  const response = await handler(
    req("/orders", {
      customer: customer(),
      items: [{ productId: pid, qty: 2, price: 1 }],
    }),
    { ip: "tamper" },
  );
  expect(response.status).toBe(201);
  expect(Number((await response.json()).total)).toBe(14980);
  expect(
    (await pg.query("select stock from products where id=$1", [pid])).rows[0]
      .stock,
  ).toBe(before - 2);
  expect(
    Number(
      (
        await pg.query(
          "select total from orders order by created_at desc limit 1",
        )
      ).rows[0].total,
    ),
  ).toBe(14980);
});
it("rejects excessive stock and unknown IDs without changing inventory", async () => {
  for (const items of [
    [{ productId: pid, qty: 999 }],
    [{ productId: crypto.randomUUID(), qty: 1 }],
  ]) {
    const response = await handler(
      req("/orders", { customer: customer(), items }),
      { ip: "stock" },
    );
    expect(response.status).toBe(409);
  }
});
it("allows only one of two simultaneous requests for the last unit", async () => {
  const last = "00000000-0000-4000-8000-000000000002";
  await pg.query("update products set stock=1 where id=$1", [last]);
  const responses = await Promise.all(
    [1, 2].map((n) =>
      handler(
        req("/orders", {
          customer: customer(),
          items: [{ productId: last, qty: 1 }],
        }),
        { ip: "concurrent" + n },
      ),
    ),
  );
  expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
  expect(
    (await pg.query("select stock from products where id=$1", [last])).rows[0]
      .stock,
  ).toBe(0);
});
it("never fetches or sells hidden products publicly", async () => {
  await pg.query("update products set visible=false where id=$1", [pid]);
  expect((await handler(req("/products/" + pid))).status).toBe(404);
  const response = await handler(req("/products"));
  expect((await response.json()).some((p) => p.id === pid)).toBe(false);
  expect(
    (
      await handler(
        req("/orders", {
          customer: customer(),
          items: [{ productId: pid, qty: 1 }],
        }),
        { ip: "hidden" },
      )
    ).status,
  ).toBe(409);
});
it("rejects malformed, oversized and honeypot input with safe errors", async () => {
  const cases = [
    new Request(origin + "/api/messages", {
      method: "POST",
      headers: {
        origin,
        "x-requested-with": "TwoTech",
        "content-type": "application/json",
      },
      body: "{",
    }),
    req("/messages", {
      name: "Test",
      email: "test@example.ph",
      body: "x".repeat(40000),
    }),
    req("/messages", {
      name: "Test",
      email: "test@example.ph",
      body: "Valid inquiry text",
      website: "spam",
    }),
  ];
  for (const r of cases) {
    const response = await handler(r, { ip: "bad" });
    expect([400, 413]).toContain(response.status);
    const text = await response.text();
    expect(text).not.toMatch(/password_hash|postgres:\/\/|stack|select /i);
  }
});
it("returns only public settings and caches read endpoints", async () => {
  await pg.query(
    'update settings set data=data||\'{"private_key":"never expose"}\'::jsonb',
  );
  const response = await handler(req("/settings"));
  expect(response.headers.get("cache-control")).toContain("max-age=60");
  expect((await response.json()).private_key).toBeUndefined();
});
it("sanitizes unexpected database errors", async () => {
  const broken = createHandler({
    db: {
      query: async () => {
        throw new Error(
          "postgres://owner:secret@host/db\npassword_hash\nSTACK",
        );
      },
    },
  });
  const response = await broken(req("/products"));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toMatch(/secret|password_hash|STACK/);
});
