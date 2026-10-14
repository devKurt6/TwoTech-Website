import fs from "node:fs";
import crypto from "node:crypto";

const files = fs
  .readdirSync("db/migrations")
  .filter((name) => name.endsWith(".sql"))
  .sort();
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
const statements = [
  "-- TWO TECH: fresh Neon database setup, including SAMPLE products and settings.",
  "-- Copy ALL of this file into Neon SQL Editor, select the intended branch/database, and Run.",
  "-- No passwords or admin accounts are included. Existing application tables cause an abort; nothing is dropped.",
  "begin;",
  "select pg_advisory_xact_lock(74018202);",
  `do $$ begin
    if exists(select 1 from unnest(array['admin_users','products','orders','order_items','bookings','quotes','messages','settings','login_attempts','rate_limits']) as t(name) where to_regclass('public.' || t.name) is not null) then
      raise exception 'Setup stopped: application tables already exist. No existing tables were changed. Use the migration runner for an existing database.';
    end if;
  end $$;`,
  "create table if not exists public.schema_migrations(name text primary key,checksum text not null,applied_at timestamptz not null default now());",
];
for (const name of files) {
  const source = fs.readFileSync("db/migrations/" + name, "utf8");
  const checksum = crypto.createHash("sha256").update(source).digest("hex");
  statements.push(
    "-- " + name,
    source,
    `insert into public.schema_migrations(name,checksum) values(${quote(name)},${quote(checksum)});`,
  );
}
statements.push(
  "-- Sample catalog and default business settings",
  fs.readFileSync("db/seed.sql", "utf8"),
  "commit;",
  "select (select count(*) from public.products) as sample_products, (select count(*) from public.settings) as settings_rows;",
);
fs.writeFileSync("db/setup-neon.sql", statements.join("\n\n") + "\n");
