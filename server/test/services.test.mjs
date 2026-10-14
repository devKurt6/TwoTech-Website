// @vitest-environment node
import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import { createHandler } from "../app.mjs";
import { createAdminHandler } from "../admin.mjs";
import { defaults } from "../../src/data/settings.js";
import { sessionToken, cookieName } from "../core.mjs";
let pg, handler, cookie;
const origin = "https://twotech.example";
const user = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "owner@example.ph",
};
beforeAll(async () => {
  process.env.JWT_SECRET = crypto.randomUUID() + crypto.randomUUID();
  pg = new PGlite();
  for (const file of fs
    .readdirSync("db/migrations")
    .sort()
    .filter((f) => !f.startsWith("004")))
    await pg.exec(fs.readFileSync("db/migrations/" + file, "utf8"));
  await pg.query("insert into settings(id,data) values(1,$1::jsonb)", [
    JSON.stringify({
      delivery_fee: 275,
      headline: "Owner's existing headline",
    }),
  ]);
  for (let run = 0; run < 2; run++)
    await pg.exec(fs.readFileSync("db/upgrade-editable-services.sql", "utf8"));
  await pg.query(
    "insert into admin_users(id,email,password_hash) values($1,$2,'test-hash')",
    [user.id, user.email],
  );
  handler = createHandler({
    adminHandler: createAdminHandler(),
    db: {
      query: (...a) => pg.query(...a),
      transaction: (...a) => pg.query(...a),
    },
  });
  cookie = cookieName + "=" + (await sessionToken(user));
}, 20000);
afterAll(async () => pg?.close());
function req(path, data, auth = false, method = data ? "POST" : "GET") {
  return new Request(origin + "/api" + path, {
    method,
    headers: {
      origin,
      "content-type": "application/json",
      "x-requested-with": "TwoTech",
      ...(auth ? { cookie } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
const booking = (patch = {}) => ({
  name: "Customer",
  email: "customer@example.ph",
  phone: "09171234567",
  service: "Custom PC assembly",
  device: "Desktop PC",
  problem: "Please inspect this desktop computer",
  preferred_date: "2099-01-01",
  preferred_time: "9:00 AM",
  mode: "Drop-off",
  ...patch,
});
it("upgrades existing settings without overwriting owner prices and content", async () => {
  const data = await (await handler(req("/settings"))).json();
  expect(data.delivery_fee).toBe(275);
  expect(data.headline).toBe("Owner's existing headline");
  expect(data.services).toHaveLength(8);
});
it("validates and persists admin pricing and synchronizes live booking choices", async () => {
  const settings = structuredClone(defaults);
  const group = settings.services.find((s) => s.id === "setup");
  group.starting_price = 950.5;
  group.items[0] = { name: "Owner PC assembly", price: 1200 };
  group.modes = ["Remote"];
  settings.booking_times = ["10:30 AM"];
  settings.quote_categories = ["Custom business system"];
  settings.quote_budgets = ["Discuss with owner"];
  expect(
    (await handler(req("/admin/settings", settings, true, "PUT"))).status,
  ).toBe(200);
  const publicData = await (await handler(req("/settings"))).json();
  expect(publicData.services.find((s) => s.id === "setup").starting_price).toBe(
    950.5,
  );
  expect((await handler(req("/bookings", booking()))).status).toBe(400);
  const valid = booking({
    service: "Owner PC assembly",
    mode: "Remote",
    preferred_time: "10:30 AM",
  });
  expect(
    (await handler(req("/bookings", valid), { ip: "configured-booking" }))
      .status,
  ).toBe(201);
  // A direct database write must obey the same current catalog.
  await expect(
    pg.query(
      "insert into bookings(name,email,phone,service,device,problem,preferred_date,preferred_time,mode) values('Customer','customer@example.ph','09171234567','Owner PC assembly','Desktop','Please inspect computer','2099-01-01','10:30 AM','Drop-off')",
    ),
  ).rejects.toThrow(/current service/);
  const quote = {
    name: "Customer",
    email: "customer@example.ph",
    phone: "09171234567",
    category: "Custom business system",
    title: "Business system",
    requirements: "A system to manage business orders and stock",
    budget: "Discuss with owner",
  };
  expect(
    (await handler(req("/quotes", quote), { ip: "configured-quote" })).status,
  ).toBe(201);
  expect(
    (await handler(req("/quotes", { ...quote, category: "Website" }))).status,
  ).toBe(400);
  // Historical records remain manageable after hiding or renaming a service.
  group.visible = false;
  group.items[0].name = "Renamed assembly";
  settings.quote_categories = ["New category"];
  expect(
    (await handler(req("/admin/settings", settings, true, "PUT"))).status,
  ).toBe(200);
  await expect(
    pg.query(
      "update bookings set status='confirmed',admin_notes='Confirmed with customer'",
    ),
  ).resolves.toBeDefined();
  await expect(
    pg.query("update quotes set status='reviewing'"),
  ).resolves.toBeDefined();
  expect((await handler(req("/bookings", valid))).status).toBe(400);
});
it("rejects negative/fractional prices, duplicate names and unknown service IDs", async () => {
  for (const change of [
    (s) => (s.services[3].starting_price = -1),
    (s) => (s.services[3].starting_price = 10.123),
    (s) => (s.services[3].items[0].name = s.services[4].items[0].name),
    (s) => (s.services[3].id = "fake"),
    (s) => (s.booking_times = []),
  ]) {
    const settings = structuredClone(defaults);
    change(settings);
    expect(
      (await handler(req("/admin/settings", settings, true, "PUT"))).status,
    ).toBe(400);
  }
});
it("accepts bounded long policy text for authenticated settings without expanding public form limits", async () => {
  const settings = structuredClone(defaults);
  for (let i = 0; i < 4; i++)
    settings.policies.privacy.sections[i][1] = "x".repeat(10000);
  expect(
    (await handler(req("/admin/settings", settings, true, "PUT"))).status,
  ).toBe(200);
  expect(
    (
      await handler(
        req("/messages", {
          name: "Customer",
          email: "customer@example.ph",
          body: "x".repeat(40000),
        }),
      )
    ).status,
  ).toBe(413);
});
