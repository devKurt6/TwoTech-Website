import fs from "node:fs";
import { format } from "prettier";
import { netlifyForms } from "../src/data/netlifyForms.js";
const forms = Object.entries(netlifyForms)
  .map(
    ([name, fields]) => `
    <form name="${name}" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden>
      <input type="hidden" name="form-name" value="${name}" />
      <input name="bot-field" />
${fields.map((field) => `      <input name="${field}"${field === "email" ? ' type="email"' : ""} />`).join("\n")}
    </form>`,
  )
  .join("\n");
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync(
  "public/netlify-forms.html",
  await format(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="noindex" />
    <title>Two Tech form registration</title>
  </head>
  <body>
    <!-- Static blueprints for Netlify deploy-time detection. Actual forms are rendered by React. -->
${forms}
  </body>
</html>
`,
    { parser: "html" },
  ),
);
