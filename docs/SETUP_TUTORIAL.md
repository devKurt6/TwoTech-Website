# Two Tech setup: GitHub → Netlify + Neon Postgres + Cloudinary

This tutorial deploys **this repository**, including its API and admin panel. Netlify hosts the website and Functions, Neon stores records, and Cloudinary stores product images. You do not need a separate backend server. Verify payment instructions and complete [the launch checklist](../LAUNCH_CHECKLIST.md) before accepting customer orders. Leave `VITE_DEMO_MODE` unset or `false` for normal production wording; setting it to `true` enables portfolio notices and requires a new deploy.

## 1. Prepare your computer and accounts

Install **Node.js 22 LTS or newer with npm** and **Git**. Open a new PowerShell window after installation and check:

```powershell
node --version
npm --version
git --version
```

Create or sign into your GitHub, Netlify, Neon, and Cloudinary accounts. Select free plans where available. Provider allowances change: check [Neon pricing](https://neon.com/pricing), [Netlify pricing](https://www.netlify.com/pricing/), and [Cloudinary pricing](https://cloudinary.com/pricing). The project avoids paid services by design, but usage must remain within each account's limits.

If the code is already on GitHub, clone your repository and enter its folder. Otherwise use your existing local `TwoTech` folder:

```powershell
Set-Location C:\Users\kurtd\Documents\TwoTech
npm install
```

The repo also supports `pnpm install --frozen-lockfile`. Use one package manager consistently. `node_modules`, `dist`, `.netlify`, and your `.env` are ignored by Git.

## 2. Create your Neon project and development branch

1. In the [Neon console](https://console.neon.tech), create a project such as **two-tech**. Choose a region reasonably near the Netlify Functions region you plan to use. Keep the database name offered by Neon or choose your own.
2. Keep the primary branch for production. Under **Branches**, create a separate branch such as **development** for local testing. Do not copy real customer data into a public/test environment.
3. Select the development branch and click **Connect**. Choose the database and owner role. Enable **connection pooling** and copy the connection string. Its hostname normally contains `-pooler`; keep its SSL settings intact. This string contains a password.
4. Copy `.env.example` to `.env` locally:

```powershell
Copy-Item .env.example .env
notepad .env
```

5. Put the development branch's pooled URL in `DATABASE_URL`. Keep it inside `.env`, never inside source code, a screenshot, a GitHub issue, or a variable beginning with `VITE_`.

```dotenv
DATABASE_URL="YOUR_DEVELOPMENT_BRANCH_POOLED_CONNECTION_STRING"
JWT_SECRET="REPLACE_WITH_THE_RANDOM_VALUE_GENERATED_BELOW"
CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME"
CLOUDINARY_API_KEY="YOUR_API_KEY"
CLOUDINARY_API_SECRET="YOUR_API_SECRET"
VITE_CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME"
MIGRATION_DATABASE_URL=
SITE_URL="http://localhost:8888"
```

These are placeholders, not working credentials. Generate a JWT signing secret with this command and paste the output into `.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Use a separate secret for production. Changing the secret invalidates existing admin sessions. If your pooled URL contains special characters, use the connection string copied by Neon rather than assembling it by hand. See [Neon's pooling documentation](https://neon.com/docs/connect/connection-pooling).

## 3. Set up Cloudinary

1. Open the [Cloudinary console](https://console.cloudinary.com) and select your product environment.
2. Find its **cloud name** and its **API Keys** settings. Copy the API key and secret privately into the matching `.env` values. The public cloud name can also be placed in `VITE_CLOUDINARY_CLOUD_NAME`.
3. No unsigned upload preset is needed. The admin panel requests a signed upload from the protected API. Never put the API secret into a `VITE_` variable.
4. The browser accepts image inputs up to 2 MB and converts them to JPEG/WebP-compatible uploads, reducing dimensions to at most 1200 pixels and targeting about 150–250 KB. Transparent images are flattened onto white; animated GIF input becomes a still image.
5. The API verifies the stored image's URL, account, format, dimensions, and byte size before attaching it to a product. Signed uploads are limited to the product ID namespace and JPEG/WebP formats. Replacement/deletion attempts server-side cleanup.

Cloudinary's current documentation states that upload presets do **not** support per-preset file-size caps. Therefore a deliberately modified upload by an already authorized admin can consume temporary storage before metadata validation refuses it. Remove unused/rejected uploads in the Media Library if needed. See [signed uploads](https://cloudinary.com/documentation/authentication_signatures) and [upload preset limitations](https://cloudinary.com/documentation/upload_presets).

## Netlify Forms email notifications

The website now saves requests into Neon/admin Inbox **and** sends a notification copy to Netlify Forms. This includes bookings, quotes, contact messages and checkout orders. No new `.env` variable is required.

1. Push the latest code to GitHub. In your Netlify project, open **Forms** and enable **form detection** if it is disabled, then redeploy. Detection happens when Netlify processes the built static HTML, so enabling it without another deploy is insufficient.
2. After deployment, confirm four forms appear: `bookings`, `quotes`, `messages`, `orders`.
3. Open **Configuration → Notifications → Form submission notifications** (or the notification settings linked from Forms). Edit your existing email notification to cover **any form**, or create/select notifications for all four names. A notification tied to an older form name does not automatically cover a new name.
4. Submit one test request through each deployed form using your own test details. Verify the same reference appears in **Admin Inbox**, **Netlify → Forms → verified submissions**, and the email notification. Check your email spam folder and Netlify spam submissions if absent. Clean up test records and reconcile order stock.
5. If the website reports the request was saved but the notification could not be confirmed, use **Retry notification**. This retries only the copy; it does not create another database request or decrement stock again. Keep the confirmation page open until the notification attempt finishes.

This copy is best-effort. Netlify acceptance does not guarantee email delivery; detection settings, spam filtering and usage limits apply. A timeout/retry can cause duplicate notification copies with the same reference. Netlify notifications are not payment confirmation: validate requests and funds using the authoritative Admin Inbox. Review the draft privacy policy for Netlify/email copy retention.

Official instructions: [form detection and AJAX submissions](https://docs.netlify.com/manage/forms/setup/), [email notifications](https://docs.netlify.com/manage/forms/notifications/).

## 4. Create the database tables, sample catalog, and admin

**Without Node.js (fresh database):** open [`db/setup-neon.sql`](../db/setup-neon.sql), copy the entire file into Neon → SQL Editor, select the branch/database used by Netlify's `DATABASE_URL`, and click Run. It creates all tables/functions, records migration checksums, and adds the sample catalog/settings in one transaction. The final result should show `sample_products = 16` and `settings_rows = 1`. It refuses to overwrite existing application tables. This replaces the migrate/seed commands for a fresh database; it does not create an admin account. Admin creation remains a separate step below. After setup, reload `/api/settings` and `/api/products` on your deployed domain.

With Node.js available, use the following setup commands instead:

Run these commands from the project folder, with `.env` pointing to your **development** branch:

```powershell
npm run db:migrate
npm run db:seed
npm run create-admin
```

The migration runner applies files in `db/migrations/` transactionally and records checksums in `schema_migrations`. Rerunning it skips unchanged migrations. Do not edit migrations after applying them; add a new migration instead. The seed adds the same 16 sample products and default business settings without overwriting existing IDs.

`create-admin` prompts for an email and a hidden password, then asks you to confirm the password. Use at least 12 characters and at most 72 UTF-8 bytes. The script stores a bcrypt cost-12 hash; it never creates default credentials. Use a terminal rather than a noninteractive output panel.

Optional stronger database permissions:

- Keep an owner connection in `MIGRATION_DATABASE_URL` locally for migrations and admin creation.
- Run `db/app-role.sql` in the Neon SQL editor as the owner. It creates a restricted `two_tech_app` login role with the table/function grants the API needs, and no schema-changing privileges.
- Set that role's password privately in Neon. If using SQL, run `ALTER ROLE two_tech_app PASSWORD 'your-own-generated-password';` only in the private console; never save that command with its real password in the repo.
- Get a pooled connection for `two_tech_app` and use it as `DATABASE_URL`. Keep the owner connection out of Netlify's runtime environment. If the console's Connect dialog does not list the SQL-created role, follow Neon's connection-string instructions to replace the username/password safely, preserving the pooled host, database, and SSL parameters.

The application role intentionally cannot create admins. Continue using the owner connection for `create-admin`. See `db/app-role.sql` for the exact permissions.

## 5. Run the whole app locally

```powershell
npm run dev
```

Open **http://localhost:8888**, the address printed by Netlify Dev. Use this address for both the customer site and `/admin/login`. Port 5173 is the Vite UI server; going directly to it skips the API proxy.

Sign in with the admin you just created. Add/edit a product, upload a test image, change the announcement banner, and check the public site. Place a sample order and inspect the Inbox. A booking remains a schedule request; a quotation request is reviewed before a quotation is provided. No card data is collected.

The Neon free compute may sleep when idle. The app shows a waking-server message after about two seconds, and public reads retry once on timeout or server failure. Order retries reuse the checkout request ID. Booking/quote/message POSTs are not automatically repeated, to avoid duplicate submissions.

Run checks before publishing:

```powershell
npm run lint
npm test
npm run test:db
npm run build
npm run format:check
```

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` for the same commands. If `netlify dev` reports **EPERM: symlink**, Windows has blocked the CLI's dependency links. Use Netlify Dev in WSL with Node/npm installed there and a checkout in the WSL filesystem, or use a Windows environment already configured to permit developer symlinks. No Windows security settings were changed by this project. This restriction does not apply to Netlify's Linux build servers. If `npm` is missing, install Node's normal distribution and reopen the terminal.

## 6. Push the repository to GitHub

If you already have a GitHub repository, use that repository's real URL. Otherwise create an **empty** repository on GitHub, for example `two-tech`. For the first push, leave GitHub's README/license initialization unchecked because this local repository already has commits.

Check your branch, working tree and configured remotes:

```powershell
git status
git branch --show-current
git remote -v
```

This delivery is on `codex/two-tech-site`. If there is no `origin`, add it, substituting your actual GitHub URL:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin codex/two-tech-site
```

If `origin` already points to your intended repository, skip `remote add` and just push. If it points to the wrong repo, use `git remote set-url origin YOUR_REAL_URL` after checking the target. Do not force-push to resolve an existing history conflict.

You may deploy this branch directly, or merge it into your existing `main` branch using a GitHub pull request and deploy `main`. Check GitHub's file list: `.env` must not appear. `.env.example` is safe because it contains names/placeholders only. [GitHub's existing-code guide](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github) covers account authentication and other push options.

## 7. Prepare the production Neon branch

1. In Neon, select the primary production branch and obtain its **own pooled connection string**. Do not use your development branch for production.
2. Temporarily point your local private `.env` owner connection at this production database. Run `npm run db:migrate`, then `npm run create-admin` to create the production owner account. Use `npm run db:seed` only if you want the sample portfolio catalog there.
3. If using `two_tech_app`, apply its role grants and set its password for production. Obtain the production runtime pooled URL for that role.
4. Restore your local `.env` to the development branch afterward. You do not need to upload `.env` to deploy.

If you branched development from a database that already contained users or sample data, inspect production/development separately before repeating commands. Admin emails are unique; `create-admin` does not silently overwrite an existing password.

## 8. Import GitHub into Netlify

1. In Netlify, choose **Add new project / Import an existing project**. Select **GitHub** and authorize access to your chosen repository.
2. Select the repo and the branch you intend to publish: `codex/two-tech-site` for a direct deployment, or `main` after merging.
3. Base directory: repository root. Build command: **`npm run build`**. Publish directory: **`dist`**. Functions directory: **`netlify/functions`**. The checked-in `netlify.toml` supplies these values.
4. Before the production deploy, add environment variables under **Project configuration → Environment variables**. If an initial deploy already happened, add the variables and trigger another deploy.

| Variable                     | Value                                                         | Must be available to |
| ---------------------------- | ------------------------------------------------------------- | -------------------- |
| `DATABASE_URL`               | Production Neon **pooled runtime** URL                        | Functions            |
| `JWT_SECRET`                 | A newly generated production secret, at least 32 random bytes | Functions            |
| `CLOUDINARY_CLOUD_NAME`      | Production Cloudinary cloud name                              | Functions            |
| `CLOUDINARY_API_KEY`         | Cloudinary API key                                            | Functions            |
| `CLOUDINARY_API_SECRET`      | Cloudinary API secret                                         | Functions            |
| `VITE_CLOUDINARY_CLOUD_NAME` | Public cloud name only                                        | Builds               |
| `SITE_URL`                   | Your final HTTPS Netlify/custom domain                        | Builds               |

If your plan/UI does not offer per-scope controls, using all scopes still keeps non-`VITE_` values out of Vite's browser bundle. Never rename a secret with `VITE_`. Do not add `MIGRATION_DATABASE_URL` to Netlify: migrations/admin creation are owner-run steps, not part of every site build. Scope and redeploy behavior are documented in [Netlify Functions environment variables](https://docs.netlify.com/build/functions/environment-variables/).

Use different **Deploy Preview** values for `DATABASE_URL` and `JWT_SECRET`, pointing previews to the development Neon branch. If you cannot isolate preview secrets, disable preview builds or leave their API unconfigured. Do not run untrusted pull-request code with production secrets.

5. Deploy. When Netlify assigns your `https://your-name.netlify.app` URL, set `SITE_URL` to that URL and redeploy so `sitemap.xml` uses the correct domain. Repeat if you add a custom domain.
6. Open the Functions page/logs and confirm the **api** function was built. Secrets belong in Netlify's private environment settings, not `netlify.toml`.

## 9. Verify the live site

Open these addresses on your new Netlify domain:

- `/`, `/shop`, `/services`, `/book`, `/quote`, `/about`, `/cart`.
- `/api/products`: JSON containing visible sample/real products. `/api/settings`: public settings only.
- `/admin/login`: your production admin login. `/api/admin/me` while logged out: a JSON **401** response, never private records.
- `/robots.txt` and `/sitemap.xml`: correct final domain and admin exclusion.

Refresh a deep URL such as `/book` directly. It must load the React app. API URLs must return JSON, not the app HTML. This repo uses one catch-all API function, with `/api/*` routed to `/.netlify/functions/api/:splat` **before** the SPA fallback. The function also validates requests when invoked through its internal URL.

Log in, edit a product, hide it, and verify public visibility. The admin's next reads bypass cache; another visitor may see the previous public catalog/settings for around 60 seconds, or up to another 300 seconds while stale-while-revalidate refreshes it. Checkout always rechecks the database, including hidden products, current prices and available stock.

Test an image upload and an order using sample customer details. Check that stock decreases, manual transfer stays `awaiting_payment`, and “Mark paid” is used only after checking the transfer. Verify booking/quote/message entries and admin notes. Try your phone and keyboard navigation. Replace or hide sample stock/prices before real selling.

## 10. Troubleshooting and updates

| Symptom                                     | What to check                                                                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API shows “server unavailable or waking up” | `DATABASE_URL` is set for Functions, uses the correct branch/role and pooled hostname, and migrations ran. Wait for a sleeping compute, then retry.                       |
| API returns HTML                            | API rewrite precedes SPA fallback; use Netlify Dev port 8888 locally, not Vite port 5173.                                                                                 |
| Admin login fails                           | Production admin was created on the production branch, `JWT_SECRET` is set, email/password are correct, and you are not in the 15-minute lockout.                         |
| Login works but immediately expires         | Use HTTPS in production and `localhost:8888` in development. Cookie must be Secure, HttpOnly, Strict and Path `/`. Do not remove those flags to fix a deployment.         |
| POST returns 403                            | Load frontend and API on the same origin. The browser wrapper sends JSON, the custom header and the matching Origin. Avoid an external API hostname.                      |
| Upload fails                                | Cloud name/key/secret match one environment, clock is correct, input is a supported image under 2 MB, and Cloudinary usage is available. No unsigned preset is necessary. |
| Product update seems delayed                | Another visitor may have cached public GET responses; admin calls bypass cache. Server order checks remain current.                                                       |
| Database script fails                       | Correct owner/migration URL and branch, tables/role permissions, and previously applied migration checksums. Avoid sharing raw logs or connection strings publicly.       |

For future changes, push to the deployment branch. Netlify rebuilds from GitHub. For a new database migration, apply it to development, test, then apply it to production before publishing code that requires it. Back up important records and monitor each provider's usage dashboard. Cancelled orders do not automatically restock: the owner adjusts stock after checking fulfilment.

**Verification boundary:** automated tests use real local PostgreSQL SQL through PGlite and mocked provider calls. No account credentials were provided during implementation, so your hosted Neon branch, real Cloudinary uploads, GitHub push and Netlify publication still need the above account steps. The Windows Netlify Dev symlink issue was observed locally and is documented rather than hidden.
