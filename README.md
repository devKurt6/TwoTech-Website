# Two Tech

A React 18/Vite/Tailwind customer website and admin panel for Two Tech in Santo Tomas, Batangas. React calls same-origin Netlify Functions; only those functions connect to Neon Postgres. Product images use signed Cloudinary uploads. The original layouts, business details and customer journeys remain.

**Start with [the complete GitHub → Netlify + Neon setup tutorial](docs/SETUP_TUTORIAL.md).** It includes Windows commands, dev/production branches, Cloudinary keys, creating your admin, environment scopes, GitHub push, deployment and troubleshooting.

No Node.js available? For a fresh Neon database, copy all of [`db/setup-neon.sql`](db/setup-neon.sql) into Neon SQL Editor and run it on the branch/database used by Netlify. It creates the tables/functions and sample data; it does not create an admin account. A `SELECT` that checks table existence does not create the tables.

## Quick start

Install Node 22+ with npm and Git. In the project folder:

```sh
npm install
# Windows PowerShell: Copy-Item .env.example .env
# macOS/Linux: cp .env.example .env
# Fill the private .env using the tutorial, then:
npm run db:migrate
npm run db:seed
npm run create-admin
npm run dev
```

Open `http://localhost:8888`, including `/admin/login`. `npm run dev` runs Netlify Dev, which proxies Vite and Functions. Port 5173 by itself is UI-only. On Windows, Netlify CLI dependency symlinks may require a developer-enabled environment or WSL; this was an observed verification limit on the implementation machine. No OS security settings were changed.

No database credentials are bundled and the app never substitutes fake success for an API error. It shows loading, waking-server, retry and empty states. Development and production should use separate Neon branches. Migrations/seed are in `db/`; schema changes are tracked with checksums and transaction locks. Scripts use the optional owner-only `MIGRATION_DATABASE_URL` when set, otherwise `DATABASE_URL`. Runtime can use the restricted role in `db/app-role.sql`. Do not deploy the owner migration URL to Netlify.

## Environment variables

| Name                                          | Location / purpose                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`                                | Server only: Neon pooled runtime connection                             |
| `JWT_SECRET`                                  | Server only: random signing secret, at least 32 bytes                   |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` | Server upload account config; cloud name/API key are public identifiers |
| `CLOUDINARY_API_SECRET`                       | Server only: signs uploads and authenticates cleanup/verification       |
| `VITE_CLOUDINARY_CLOUD_NAME`                  | Public optional build value; never put a secret here                    |
| `MIGRATION_DATABASE_URL`                      | Optional local privileged pooled URL for setup scripts only             |
| `SITE_URL`                                    | Build: canonical HTTPS domain for sitemap; falls back to Netlify `URL`  |

Use `.env` locally and Netlify's private environment settings in production. Server variables must include Functions scope. A variable prefixed `VITE_` can enter the browser bundle. `.env`, `.netlify`, build outputs and dependencies are ignored by Git. No default admin or password is seeded.

## Security design

- **Server boundary:** `server/app.mjs` dispatches a single Netlify function. Shared modules handle Zod schemas, limits, sessions, CSRF and consistent `{error:{code,message,fields?}}` errors. Browser guards provide UX; every admin route independently verifies the signed token and current `admin_users` record. Query parameters and customer values are bound SQL parameters; dynamic table/column/sort choices come from explicit allowlists. Public product reads always require `visible=true`; settings expose only known public keys. Public writes cannot supply administrative status, notes, timestamps or IDs.
- **Order integrity:** `POST /api/orders` strips client prices/totals and calls the plain invoker `place_order` PL/pgSQL function through a Neon HTTP transaction. The function locks rows in UUID order, rejects hidden or insufficient stock, reads current database prices/settings, inserts the order/items and decrements inventory atomically. A random request UUID and transaction advisory lock make retrying the same checkout idempotent. The database does not trust browser stock or price calculations.
- **Admin sessions:** passwords use portable `bcryptjs`, cost 12, avoiding native binary compatibility issues in Functions. Admin creation requires a hidden terminal prompt, 12+ characters and at most 72 UTF-8 bytes. `jose` HS256 JWTs expire after eight hours, with fixed issuer/audience and algorithm. Tokens live in `__Host-tt_session`, an HttpOnly, Secure, SameSite=Strict, Path `/` cookie; never localStorage. Every protected request verifies the admin still exists. Logout clears the cookie; a copied token remains valid until expiry or secret rotation unless its admin is removed, which is the stated minimal stateless-session tradeoff.
- **CSRF:** state-changing requests, including login, require matching Origin, JSON Content-Type, and `X-Requested-With: TwoTech`. No CORS wildcard is supplied. This applies through both `/api` rewrites and direct function URLs. Browser requests use same-origin credentials.
- **Abuse controls:** login reserves an attempt under a database advisory lock before password verification and locks an email **or** IP after five attempts in fifteen minutes. Responses stay generic. Public writes use database-backed atomic per-IP counters (ten requests/minute shared across inquiry forms; ten/minute for orders); signed image requests have their own six/minute limit. Netlify's trusted context IP is used, not an arbitrary forwarded header. Old counter/attempt records are pruned. Honeypots, payload/field bounds and browser throttling complement these checks. Provider-level DDoS controls and a CAPTCHA can be added if real traffic requires them.
- **Image safety:** the browser validates the source image, compresses/resizes it and uploads directly to Cloudinary with server-signed fixed format, namespace, transform and overwrite parameters. API secrets never leave Functions. Before a product save, the server verifies the asset's real metadata, exact HTTPS account URL and public ID, allowed raster format, 2 MB maximum and 1200-pixel bounds. Replaced/deleted images are cleaned up server-side where possible. Per-preset file-size caps are not supported by Cloudinary; oversized uploads by an authorized admin can temporarily use provider storage but cannot be attached to products. Clean up unlinked assets in the Media Library after interrupted uploads or cleanup failures.
- **Errors and headers:** no SQL messages, password hashes, connection strings or stack traces are returned. Static pages receive CSP, framing, MIME-sniffing, referrer and HTTPS protections. Function JSON responses set their own safety/cache headers because static Netlify header rules do not cover function output. `/admin/*` is noindex.

## API

Public: `GET /api/products` (optional `q`, `category`, `maxPrice`, `sort=featured|lo|hi`), `GET /api/products/:id`, `GET /api/settings`, `POST /api/orders`, `POST /api/bookings`, `POST /api/quotes`, `POST /api/messages`.

Admin: `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`, `GET/POST /api/admin/products`, `PATCH/DELETE /api/admin/products/:id`, `POST /api/admin/upload-signature`, `DELETE /api/admin/images` (unlinked upload cleanup), `GET /api/admin/inbox?type=orders|bookings|quotes|messages`, `PATCH /api/admin/inbox/:type/:id`, `GET/PUT /api/admin/settings`, `GET /api/admin/dashboard`.

Public GET responses use `max-age=60, stale-while-revalidate=300`. Admin responses/writes are no-store, and successful edits make the same browser's public reads bypass cache for a minute. Other visitors may see a stale catalog for 60 seconds plus up to 300 seconds while revalidating. Checkout remains authoritative against current database rows. No Realtime dependency is needed. Requests refresh on navigation/focus; reads and idempotent orders retry once on timeout/5xx. Other POSTs are not automatically retried, to avoid duplicates.

## Deployment

See [the tutorial](docs/SETUP_TUTORIAL.md) for all steps. Import the GitHub repo into Netlify, select your deployment branch, use `npm run build`, publish `dist`, and use `netlify/functions`. Configure production Function secrets, isolate Deploy Preview secrets, then redeploy. The API rewrite comes before the SPA fallback. Apply production migrations and create the owner manually; builds never run migrations or create credentials. Verify deep links, JSON API responses, admin session cookies, images, stock and request records after deployment.

No GitHub remote push, hosted Neon migration, real Cloudinary upload, or live Netlify publication was performed because account credentials/project access were not provided. Local PostgreSQL tests and provider mocks verify the implementation, not an unconfigured external account.

## Tests and manual QA

```sh
npm run lint
npm test
npm run test:db
npm run build
npm run format:check
```

Tests execute the actual SQL in local PostgreSQL/PGlite and call the real function handlers with injected database/provider adapters. They cover price/total tampering, stock decrement, overselling/parallel last-unit requests, hidden products, every unauthenticated admin route, CSRF, generic login throttling, forged tokens, invalid/oversized/malformed inputs, honeypots, public settings allowlisting, sanitized errors and image signatures/metadata. PGlite serializes its single connection: the parallel test verifies request outcomes, not independent Neon network sessions. Repeat the last-unit race on an isolated hosted Neon branch before launch. Frontend tests cover validation, cart logic, formatting, fallback/retry, checkout and dialog focus.

Original public and admin layouts were checked at 320/768/1280 pixels. An isolated `/qa/admin.html` development-only fixture supports UI layout checks without live writes; it is not part of `dist` or a production auth bypass. See [verification notes](qa/verification.md).

Connected manual checklist:

- Create a dev admin; verify login, logout, session expiry and rejected missing/foreign-origin mutations.
- CRUD and hide a sample product; upload, replace and remove an image; check Cloudinary cleanup.
- Place a sample order, check server total and stock, retry its request ID, attempt excessive quantity and two last-unit purchases.
- Submit booking/quote/contact forms and inspect Inbox, notes, statuses and verified manual-payment marking.
- Disable the network and test retry without losing cart/forms. Verify a cold database produces a useful loading message.
- Test keyboard focus/Escape, reduced motion, filled dialogs/carts and long text at 320/768/1280 pixels.
- On Netlify, directly refresh `/book` and `/admin/login`, check function JSON/security headers, final sitemap domain and admin noindex.

## Sample data and operating assumptions

Real: business name, supplied artwork, founder background, contact details, address and Facebook/Maps links. Sample: all 16 catalog entries, stock, specifications/prices and service starting prices. Hours remain editable at 9 AM–8 PM with operating days unconfirmed. No reviews, certifications or guarantees were invented. Business dates use Asia/Manila; prices use `toLocaleString('en-PH')`.

Cash and Bank/GCash manual transfer are the only payment methods. Payment/order demo labels remain until the owner confirms real instructions; connected APIs save actual records. Transfers start as `awaiting_payment`; only the admin marks them paid after verification. No card data is collected, no payment processor is implemented, and no automatic email/SMS or refund workflow is implied. Cancelled orders do not auto-restock; the owner checks fulfilment then adjusts inventory.

Free compute can suspend and wake, and compute/storage/bandwidth allowances change. Check the official [Neon](https://neon.com/pricing), [Netlify](https://www.netlify.com/pricing/) and [Cloudinary](https://cloudinary.com/pricing) pricing pages and monitor your account usage. Route-specific metadata/JSON-LD update in the browser; non-JavaScript social crawlers may need prerendering for per-route previews.
