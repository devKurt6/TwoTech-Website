# Two Tech

React 18 + Vite + Tailwind + React Router customer site and lazy-loaded Supabase admin panel. The layouts and copy were ported from the two original HTML prototypes in `reference/`. The existing `Two Tech.jpg` artwork is also provided as `public/logo.png`; if that image fails, the header falls back to the TwoTech wordmark.

## Local setup

Use Node 22+ and npm, or pnpm. This repo includes a pnpm lockfile.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

For npm: `npm install`, then `npm run dev`. Open the URL printed by Vite. Without Supabase variables the public site uses the 16 sample products; form and order confirmations are explicitly demo-only and nothing is transmitted. Admin login is disabled until Supabase is configured. With both variables present, database/network errors show a retry state; the app never silently replaces a failed live database with sample data.

## Supabase

1. Create a Supabase project. Copy its project URL and browser anon key into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart Vite after changes. Never use a service-role key in the browser, `.env.example`, Git, settings, or Netlify frontend variables.
2. Apply all files in `supabase/migrations/` in filename order in the project's SQL editor. Alternatively install the Supabase CLI, run `supabase link --project-ref YOUR_PROJECT_REF`, then `supabase db push`. CLI project credentials stay outside this repository.
3. Run `supabase/seed.sql` once in the SQL editor for a test/empty catalog. It uses stable UUIDs and avoids overwriting existing rows. Sample stock and prices must be replaced or hidden before selling.
4. In Authentication → Users, create the owner with email/password. Copy that user's UUID and run the following in the SQL editor:

```sql
insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');
```

5. Open `/admin/login`. A signed-in account without an `admins` row sees “You're not authorized.” Browser clients cannot add administrators. Configure Supabase's Auth Site URL and redirect URLs for the final domain, disable unnecessary public signups, and set suitable Auth rate limits.
6. Optionally enable the `products` table in the `supabase_realtime` publication for cross-tab product updates. Reads refresh on route navigation and window focus even without Realtime.

RLS is enabled on all application tables. Only visible products and public settings can be read publicly. Orders and order items have no public insert or select permission. `place_order(customer, items)` validates customer data, aggregates duplicate quantities, locks products in UUID order, uses database prices and delivery fees, and decrements stock in a single transaction. A random `request_id` prevents a network retry from placing the same order twice. The cart stores only `{productId, qty}` in localStorage and revalidates against visible products and stock.

Public booking, quote and message inserts can only set customer columns. `submit_request(kind, payload)` is a restricted insert wrapper returning the generated reference without exposing any records. It ignores client status, admin notes, IDs and timestamps. This resolves the need for a reference while preserving the public SELECT prohibition. Booking service/mode combinations and dates are validated in PostgreSQL as well as the browser. References use the full random UUID to avoid short-code collisions.

`product-images` allows public reads, admin-only writes/deletes, supported image MIME types, and a 2 MB limit. Client uploads also validate type/size, show a preview, and remove replaced/unused images after the database save. A failed cleanup can be handled in the Supabase Storage dashboard. Settings are public: never store passwords, private account details or API keys there.

## Payments and operations

Only Cash on Pickup/Delivery and Bank/GCash manual transfer are offered. No card fields or payment gateway exists. A manual transfer creates an `awaiting_payment` order; an admin verifies the transfer and clicks “Mark paid.” Cash orders start as `new`. The “demo order/payment flow” labels intentionally remain even with a connected database until the owner confirms the real payment instructions and operating procedure. Connected forms really save requests; unconfigured forms do not.

Orders reserve stock at creation. Cancelling an order does **not** automatically restock it; the owner inspects the reservation/fulfilment state and adjusts stock explicitly in Products. This avoids restocking an already delivered order. Email/SMS notifications, refunds, gateway payments, PayMongo/webhooks and customer accounts are not implemented or implied.

## Netlify

1. Push the repository to your Git provider and import it into Netlify, or deploy a local `dist/` build using your own Netlify account.
2. Build command: `npm run build`. Publish directory: `dist`. `netlify.toml` includes SPA fallback, CSP, HTTPS/HSTS, framing protection, MIME-sniffing protection and other security headers. No custom backend or Netlify Function is needed for manual payments.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify's build environment. Add `SITE_URL=https://your-final-domain` for the canonical sitemap, especially with a custom domain. If omitted, the build uses Netlify's `URL`; local builds use `http://localhost:5173`. Rebuild whenever these values change.
4. Deploy, then directly load `/shop`, `/book`, and `/admin/login` to confirm the SPA fallback. Check response security headers and perform the connected QA below on a test project before launch.
5. If using a Supabase custom domain or self-hosted project, update the CSP `connect-src` and `img-src` allowlists in `netlify.toml` to match that host.

This delivery includes deployment configuration and instructions; no hosted Supabase/Netlify project or credentials were provided, so no live migration, upload, Auth login or Netlify publication was performed. Local PostgreSQL tests verify the SQL; they do not certify a remote project's configuration. Per-page metadata and LocalBusiness JSON-LD update in the browser. Social crawlers that do not execute JavaScript may need a prerendering service for route-specific link previews.

## Verification

```sh
pnpm lint
pnpm test
pnpm test:db
pnpm build
pnpm format:check
```

`test:db` runs the actual migrations and seed in isolated PostgreSQL (PGlite), with Supabase-compatible test Auth and Storage schemas. It checks RLS and SQL grants for anonymous, authenticated non-admin and admin roles; visibility; immutable customer defaults; server price/fee integrity; stock decrement; duplicate retry; hidden products; overselling rejection; and transaction rollback. It does not test hosted Auth, Storage HTTP MIME/size enforcement or multi-connection concurrency under load. Row locks and deterministic lock ordering provide the transaction design for concurrent production requests.

Unit/component tests cover validators, peso formatting, cart reconciliation, missing images, network retry, booking preselection/modes, checkout confirmation and dialog Escape handling. Browser QA covers all public routes, product details, 404, and admin login at 320/768/1280 pixels, with no horizontal overflow. Admin screens also have an isolated development-only layout fixture at `/qa/admin.html`, with in-memory test rows. This fixture is **not** a production route or Vite build input and never accesses live records; its HTML/module are absent from `dist`.

Manual connected QA checklist:

- Set actual prices, stock, photos, payment instructions, delivery fee and operating days; review founder bio.
- Hide a product and confirm it vanishes after route refresh; verify an existing cart removes it and caps changed stock.
- Tab through navigation and forms, open/close dialogs with Escape, confirm focus remains trapped and returns to the trigger, and check reduced motion. Check long names and filled carts at 320/768/1280 pixels.
- Sign in with a non-admin account: confirm blocked UI and denied reads/writes. Sign in as owner: create, edit, soft-hide and delete a test product.
- Upload valid images, replace/remove them, and reject oversized/non-image uploads. Verify Storage directly rejects a non-admin upload.
- Place a test order; inspect database-priced totals and stock. Attempt a forged price, excessive quantity and simultaneous purchase of the last unit. Verify only available stock can sell. Retry with the same request ID and confirm there is one order.
- Submit booking, quote and contact forms; check references and Inbox contents, notes/status changes and mark-paid behavior. Verify no public client can select their records.
- Disable the network and confirm readable errors/retry; verify failed checkout retains the cart. Confirm client honeypot and 30-second throttle. These deter simple spam; add server-side CAPTCHA/rate limiting if actual traffic requires stronger protection.
- On Netlify, refresh deep links, inspect CSP/header responses, sitemap domain and `robots.txt`, page titles, metadata and home JSON-LD.

## Data and assumptions

Real: business name, contact details, address, Facebook/Maps links and the provided founder background/artwork. Sample: all 16 product listings, descriptions/specifications, prices, stock and five starting-price values. The founder bio is editable in admin; no reviews, certifications, project counts or guarantees were invented. Hours default to 9 AM–8 PM with operating days explicitly unconfirmed. Service prices live in `src/data/services.js`; all prices marked `*` require inspection, device condition, parts and agreed scope. GPU service is not suitable for every model.

UI is English, peso formatting uses `toLocaleString('en-PH')`, and business dates use Asia/Manila. The prototype's navigation “Custom Projects” maps to `/quote`, “Contact” maps to `/about#contact`, and each product supports its own URL with a dialog. The app uses React components and a small `htm` template helper for the directly ported customer layouts; new forms and admin components use JSX. User content is rendered as text, never raw HTML.

Six phase commits capture scaffold/UI, database, database reads, admin, transactional forms/Inbox and deployment/readiness checks. See `qa/verification.md` for the completed local checks and remaining external checks.
