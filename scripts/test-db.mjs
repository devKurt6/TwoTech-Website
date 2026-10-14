import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth,storage to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant all on storage.objects to authenticated;grant select on storage.objects to anon;`,
);
for (const file of fs.readdirSync("supabase/migrations").sort())
  await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
await db.exec(fs.readFileSync("supabase/seed.sql", "utf8"));
assert.equal(
  (await db.query("select count(*)::int n from public.products")).rows[0].n,
  16,
);
await db.exec(
  "update public.products set visible=false where id='00000000-0000-4000-8000-000000000001';set role anon;",
);
assert.equal(
  (await db.query("select count(*)::int n from public.products")).rows[0].n,
  15,
);
async function denied(sql) {
  await assert.rejects(() => db.exec(sql));
}
await denied("select * from public.orders");
await denied(
  "insert into public.products(name,category,price) values('Hacked','RAM',1)",
);
await denied(
  "insert into public.messages(name,email,body,handled) values('Spam','s@a.ph','A long enough message',true)",
);
await db.exec(
  "insert into public.messages(name,email,body) values('Customer','a@b.ph','A legitimate inquiry');reset role;set role authenticated;select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);",
);
assert.equal((await db.query("select * from public.messages")).rows.length, 0);
await denied(
  "insert into public.products(name,category,price) values('Hacked','RAM',1)",
);
await db.exec(
  "reset role;insert into auth.users values('22222222-2222-4222-8222-222222222222');insert into public.admins values('22222222-2222-4222-8222-222222222222');set role authenticated;select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);",
);
assert.equal((await db.query("select * from public.messages")).rows.length, 1);
await db.exec(
  "update public.products set visible=true where id='00000000-0000-4000-8000-000000000001';reset role;",
);
console.log(
  "PASS: migrations, 16 seeds, product visibility, anonymous permissions, forced defaults, non-admin isolation and admin access",
);
if (fs.existsSync("supabase/migrations/202610140002_orders_requests.sql")) {
  const pid = "00000000-0000-4000-8000-000000000001";
  const base = {
    name: "Test Customer",
    email: "customer@example.ph",
    phone: "09171234567",
    delivery_method: "delivery",
    address: "123 Santo Tomas Batangas",
    payment_method: "manual_transfer",
    request_id: "33333333-3333-4333-8333-333333333333",
    subtotal: 1,
    total: 1,
    delivery_fee: 0,
  };
  const order = async (customer, items) =>
    (
      await db.query("select public.place_order($1::jsonb,$2::jsonb) result", [
        JSON.stringify(customer),
        JSON.stringify(items),
      ])
    ).rows[0].result;
  await db.exec("set role anon");
  const placed = await order(base, [
    { productId: pid, qty: 2, price: 1, stock: 999 },
  ]);
  assert.equal(Number(placed.total), 15130);
  assert.match(placed.ref, /^ORD-/);
  const repeated = await order(base, [{ productId: pid, qty: 2 }]);
  assert.equal(repeated.ref, placed.ref);
  await db.exec("reset role");
  assert.equal(
    (await db.query("select stock from public.products where id=$1", [pid]))
      .rows[0].stock,
    10,
  );
  assert.equal(
    (
      await db.query("select status from public.orders where ref=$1", [
        placed.ref,
      ])
    ).rows[0].status,
    "awaiting_payment",
  );
  const count = (await db.query("select count(*)::int n from public.orders"))
    .rows[0].n;
  await db.exec("set role anon");
  await assert.rejects(
    () =>
      order({ ...base, request_id: "44444444-4444-4444-8444-444444444444" }, [
        { productId: pid, qty: 11 },
      ]),
    /Insufficient stock/,
  );
  await assert.rejects(
    () =>
      order({ ...base, request_id: "44444444-4444-4444-8444-444444444444" }, [
        { productId: pid, qty: 1 },
        { productId: "00000000-0000-4000-8000-000000000004", qty: 1 },
      ]),
    /Insufficient stock/,
  );
  await assert.rejects(
    () =>
      order({ ...base, request_id: "44444444-4444-4444-8444-444444444444" }, [
        { productId: pid, qty: -1 },
      ]),
    /Invalid product or quantity/,
  );
  await db.exec("reset role");
  assert.equal(
    (await db.query("select stock from public.products where id=$1", [pid]))
      .rows[0].stock,
    10,
  );
  assert.equal(
    (await db.query("select count(*)::int n from public.orders")).rows[0].n,
    count,
  );
  await db.exec(
    "update public.products set visible=false where id='00000000-0000-4000-8000-000000000001';set role anon;",
  );
  await assert.rejects(
    () =>
      order({ ...base, request_id: "44444444-4444-4444-8444-444444444444" }, [
        { productId: pid, qty: 1 },
      ]),
    /no longer available/,
  );
  const send = async (kind, payload) =>
    (
      await db.query("select public.submit_request($1,$2::jsonb) result", [
        kind,
        JSON.stringify(payload),
      ])
    ).rows[0].result;
  const message = await send("messages", {
    name: "Test",
    email: "test@example.ph",
    body: "A valid contact message",
    handled: true,
    admin_notes: "injected",
  });
  assert.match(message.ref, /^MSG-/);
  const booking = await send("bookings", {
    name: "Test",
    email: "test@example.ph",
    phone: "09171234567",
    service: "Custom PC assembly",
    device: "Desktop PC",
    problem: "Cannot start the desktop",
    preferred_date: "2099-01-01",
    preferred_time: "9:00 AM",
    mode: "Drop-off",
    status: "done",
  });
  assert.match(booking.ref, /^BK-/);
  await assert.rejects(
    () =>
      send("bookings", {
        name: "Test",
        email: "test@example.ph",
        phone: "09171234567",
        service: "Custom PC assembly",
        device: "Desktop PC",
        problem: "Cannot start the desktop",
        preferred_date: "2099-01-01",
        preferred_time: "9:00 AM",
        mode: "Remote",
      }),
    /supported mode/,
  );
  const quote = await send("quotes", {
    name: "Test",
    email: "test@example.ph",
    phone: "09171234567",
    category: "Website",
    title: "Shop website",
    requirements: "Build a catalog and booking website",
    budget: "Not sure yet",
    status: "closed",
  });
  assert.match(quote.ref, /^QR-/);
  await db.exec("reset role");
  assert.equal(
    (
      await db.query(
        "select handled,admin_notes from public.messages where ref=$1",
        [message.ref],
      )
    ).rows[0].handled,
    false,
  );
  assert.equal(
    (
      await db.query("select status from public.bookings where ref=$1", [
        booking.ref,
      ])
    ).rows[0].status,
    "pending",
  );
  assert.equal(
    (
      await db.query("select status from public.quotes where ref=$1", [
        quote.ref,
      ])
    ).rows[0].status,
    "pending",
  );
  console.log(
    "PASS: server pricing/fee, stock decrement, idempotent retry, overselling rejection, rollback, hidden products, request refs/defaults and service modes",
  );
}
await db.close();
