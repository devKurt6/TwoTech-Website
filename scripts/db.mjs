import fs from "node:fs/promises";
import crypto from "node:crypto";
import { ownerPool } from "./db-client.mjs";
const pool = ownerPool(),
  client = await pool.connect();
try {
  await client.query("begin");
  await client.query("select pg_advisory_xact_lock(74018202)");
  if (process.argv[2] === "seed")
    await client.query(await fs.readFile("db/seed.sql", "utf8"));
  else if (process.argv[2] === "migrate") {
    await client.query(
      "create table if not exists public.schema_migrations(name text primary key,checksum text not null,applied_at timestamptz not null default now())",
    );
    for (const name of (await fs.readdir("db/migrations"))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      const source = await fs.readFile("db/migrations/" + name, "utf8"),
        checksum = crypto.createHash("sha256").update(source).digest("hex");
      const previous = await client.query(
        "select checksum from public.schema_migrations where name=$1",
        [name],
      );
      if (previous.rows.length) {
        if (previous.rows[0].checksum !== checksum)
          throw new Error("Applied migration changed: " + name);
        continue;
      }
      await client.query(source);
      await client.query(
        "insert into public.schema_migrations(name,checksum) values($1,$2)",
        [name, checksum],
      );
      console.log("Applied " + name);
    }
  } else throw new Error("Use db:migrate or db:seed.");
  await client.query("commit");
  console.log("Database operation completed.");
} catch {
  await client.query("rollback");
  console.error(
    "Database operation failed. Check the connection, permissions and migration files; no credentials were logged.",
  );
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
