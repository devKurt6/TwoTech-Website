// @vitest-environment node
import { expect, it } from "vitest";
import {
  validateAdminEmail,
  validateAdminPassword,
  adminFailureMessage,
} from "../../scripts/admin-support.mjs";

it("distinguishes password mismatch, length and valid input", () => {
  expect(() => validateAdminPassword("short", "short")).toThrow("at least 12");
  expect(() =>
    validateAdminPassword("long enough fixture", "different"),
  ).toThrow("did not match");
  expect(() => validateAdminPassword("a".repeat(73), "a".repeat(73))).toThrow(
    "72 UTF-8 bytes",
  );
  expect(() => validateAdminPassword("🔒".repeat(20), "🔒".repeat(20))).toThrow(
    "72 UTF-8 bytes",
  );
  expect(() =>
    validateAdminPassword("valid fixture only", "valid fixture only"),
  ).not.toThrow();
  expect(() => validateAdminEmail("fixture@example.ph")).not.toThrow();
  expect(() => validateAdminEmail("invalid")).toThrow("valid admin email");
});

it("explains setup failures without returning SQL or credentials", () => {
  expect(adminFailureMessage({ code: "23505" })).toContain("already exists");
  expect(adminFailureMessage({ code: "42501" })).toContain("owner connection");
  expect(adminFailureMessage({ code: "42P01" })).toContain("table is missing");
  expect(adminFailureMessage({ code: "DB_CONFIG_MISSING" })).toContain(
    "local .env",
  );
  const raw = new Error(
    "postgres://owner:private-secret@host/database SQL stack",
  );
  expect(adminFailureMessage(raw)).not.toMatch(
    /private-secret|postgres:\/\/|SQL stack/,
  );
});
