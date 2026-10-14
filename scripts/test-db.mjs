import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
for (const file of fs.readdirSync("db/migrations").sort())
  await db.exec(fs.readFileSync("db/migrations/" + file, "utf8"));
await db.exec(fs.readFileSync("db/seed.sql", "utf8"));
assert.equal(
  (await db.query("select count(*)::int n from products")).rows[0].n,
  16,
);
assert.equal(
  (await db.query("select prosecdef from pg_proc where proname='place_order'"))
    .rows[0].prosecdef,
  false,
);
const customer = {
  name: "Test",
  email: "test@example.ph",
  phone: "09171234567",
  delivery_method: "pickup",
  payment_method: "cash",
  request_id: "11111111-1111-4111-8111-111111111111",
};
const items = [
  { productId: "00000000-0000-4000-8000-000000000001", qty: 1, price: 1 },
];
const result = await db.query(
  "select place_order($1::jsonb,$2::jsonb) result",
  [JSON.stringify(customer), JSON.stringify(items)],
);
assert.equal(Number(result.rows[0].result.total), 7490);
assert.equal(
  (
    await db.query("select stock from products where id=$1", [
      items[0].productId,
    ])
  ).rows[0].stock,
  11,
);
console.log(
  "PASS: Neon-compatible schema, 16 seeds, invoker order function, trusted prices and stock.",
);
await db.exec(fs.readFileSync("db/app-role.sql", "utf8"));
await db.exec("set role two_tech_app");
assert.equal(
  (await db.query("select count(*)::int n from products")).rows[0].n,
  16,
);
await assert.rejects(() =>
  db.query(
    "insert into admin_users(email,password_hash) values('blocked@example.ph','not-a-hash')",
  ),
);
await assert.rejects(() => db.exec("drop table public.products cascade"));
await db.exec("reset role");
console.log(
  "PASS: restricted runtime role can read application records but cannot create admins or drop tables.",
);
await db.close();
