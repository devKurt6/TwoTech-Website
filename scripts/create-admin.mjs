import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import { ownerPool } from "./db-client.mjs";
import {
  validateAdminEmail,
  validateAdminPassword,
  adminFailureMessage,
} from "./admin-support.mjs";
let hidden = false;
const output = new Writable({
  write(chunk, _encoding, done) {
    if (!hidden) process.stdout.write(chunk);
    done();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: true });
let pool;
try {
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  validateAdminEmail(email);
  process.stdout.write("Password (12+ characters, hidden): ");
  hidden = true;
  const password = await rl.question("");
  hidden = false;
  process.stdout.write("\n");
  process.stdout.write("Confirm password (hidden): ");
  hidden = true;
  const confirmation = await rl.question("");
  hidden = false;
  process.stdout.write("\n");
  validateAdminPassword(password, confirmation);
  const hash = await bcrypt.hash(password, 12);
  pool = ownerPool();
  await pool.query(
    "insert into public.admin_users(email,password_hash) values($1,$2)",
    [email, hash],
  );
  console.log("Admin created. No default credentials were installed.");
} catch (error) {
  console.error("Could not create admin: " + adminFailureMessage(error));
  process.exitCode = 1;
} finally {
  hidden = false;
  rl.close();
  if (pool) await pool.end();
}
