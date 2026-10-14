import fs from "node:fs";
import { PRODUCTS } from "../src/data/products.js";
import { defaults } from "../src/data/settings.js";
const q = (s) => "'" + s.replaceAll("'", "''") + "'";
fs.writeFileSync(
  "db/seed.sql",
  "-- SAMPLE products, prices, stock and descriptions. Business contact details are real.\n" +
    PRODUCTS.map(
      (p) =>
        `insert into public.products(id,name,category,price,stock,description,specs) values ('00000000-0000-4000-8000-${String(p.id).padStart(12, "0")}',${q(p.name)},${q(p.cat)},${p.price},${p.stock},${q(p.desc)},${q(p.specs)}) on conflict(id) do nothing;`,
    ).join("\n") +
    `\ninsert into public.settings(id,data) values(1,${q(JSON.stringify(defaults))}::jsonb) on conflict(id) do nothing;\n`,
);

