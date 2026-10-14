import { z } from "zod";
import { defaults } from "../src/data/settings.js";
import { serviceErrors } from "../src/data/services.js";
const money = z
  .number()
  .min(0)
  .max(999999)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-5);
export const choices = z
  .array(z.string().trim().min(1).max(150))
  .min(1)
  .max(40)
  .refine((a) => new Set(a).size === a.length, "Use unique choices.");
const services = z
  .array(
    z
      .object({
        id: z.enum([
          "dev",
          "auto",
          "emb",
          "setup",
          "repair",
          "soft",
          "clean",
          "net",
        ]),
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().min(1).max(5000),
        visible: z.boolean(),
        starting_price: money.nullable(),
        price_label: z.string().trim().min(1).max(50),
        items: z
          .array(
            z
              .object({
                name: z.string().trim().min(1).max(200),
                price: money.nullable(),
              })
              .strict(),
          )
          .min(1)
          .max(40),
        modes: z.array(z.enum(["Drop-off", "Onsite", "Remote"])).max(3),
      })
      .strict(),
  )
  .length(8)
  .refine(
    (a) => !Object.keys(serviceErrors(a)).length,
    "Check service prices, inclusions and modes.",
  );
const policy = z
  .object({
    title: z.string().trim().min(1).max(150),
    intro: z.string().max(5000),
    sections: z
      .array(
        z.tuple([
          z.string().trim().min(1).max(150),
          z.string().trim().min(1).max(10000),
        ]),
      )
      .min(1)
      .max(30),
  })
  .strict();
export const extraSettings = {
  services: services.default(defaults.services),
  booking_times: choices.default(defaults.booking_times),
  quote_categories: choices.default(defaults.quote_categories),
  quote_budgets: choices.default(defaults.quote_budgets),
  maps: z
    .string()
    .url()
    .max(2000)
    .refine((v) => new URL(v).protocol === "https:", "Use HTTPS.")
    .default(defaults.maps),
  founder_name: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .default(defaults.founder_name),
  service_area: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .default(defaults.service_area),
  business_intro: z
    .string()
    .trim()
    .min(1)
    .max(5000)
    .default(defaults.business_intro),
  policies: z
    .object({ privacy: policy, terms: policy })
    .strict()
    .default(defaults.policies),
};
