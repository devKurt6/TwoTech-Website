import fs from "node:fs";
import "dotenv/config";
const origin = new URL(
  process.env.SITE_URL || process.env.URL || "http://localhost:8888",
).origin;
const paths = ["/", "/shop", "/services", "/book", "/quote", "/about", "/cart"];
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync(
  "public/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("") +
    "</urlset>\n",
);
fs.writeFileSync(
  "public/robots.txt",
  `User-agent: *\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`,
);
