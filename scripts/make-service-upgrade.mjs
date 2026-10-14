import fs from "node:fs";
import crypto from "node:crypto";
const name = "004_editable_services.sql";
const sql = fs.readFileSync("db/migrations/" + name, "utf8");
const checksum = crypto.createHash("sha256").update(sql).digest("hex");
fs.writeFileSync(
  "db/upgrade-editable-services.sql",
  `-- EXISTING Two Tech database only. Keeps owner settings, inventory and historical records.
-- Paste this entire file into Neon SQL Editor on the database/branch used by Netlify.
begin;
select pg_advisory_xact_lock(74018202);
create table if not exists public.schema_migrations(name text primary key,checksum text not null,applied_at timestamptz not null default now());
do $upgrade$
declare existing_checksum text;
begin
 if to_regclass('public.bookings') is null then raise exception 'Existing application tables required. Use setup-neon.sql only for a fresh database.'; end if;
 select checksum into existing_checksum from public.schema_migrations where name='${name}';
 if existing_checksum is not null and existing_checksum<>'${checksum}' then raise exception 'Migration checksum mismatch; no changes made'; end if;
 if existing_checksum is null then
  execute $migration$${sql}$migration$;
  insert into public.schema_migrations(name,checksum) values('${name}','${checksum}');
 end if;
end $upgrade$;
commit;
`,
);
