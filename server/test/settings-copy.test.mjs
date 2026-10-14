// @vitest-environment node
import { it, expect } from "vitest";
import { publicSettings } from "../public.mjs";
import { defaults } from "../../src/data/settings.js";
import { legacyPaymentInstructions } from "../../src/data/demoCopy.js";
it("normalizes the exact obsolete seed payment warning without changing owner instructions", () => {
  expect(
    publicSettings({ payment_instructions: legacyPaymentInstructions })
      .payment_instructions,
  ).toBe(defaults.payment_instructions);
  expect(
    publicSettings({
      payment_instructions: "Please contact our owner before transferring.",
    }).payment_instructions,
  ).toBe("Please contact our owner before transferring.");
});
