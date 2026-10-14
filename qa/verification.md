# Verification after the Neon migration

## Netlify notification copies — 14 October 2026

- Added deploy-time static registrations for bookings, quotations, messages and orders. The browser mirrors only successfully saved requests, with the database reference and a field allowlist. No extra credentials are needed.
- Automated tests verify all static registrations, URL encoding, reference correlation, secret-field exclusion, no mirror after API failure, order server totals, and notification-only retry without repeating the primary save.
- All 50 tests, lint, formatting and the production build pass. The built registration page is served with HTTP 200 in the local production preview and contains all four definitions.
- Live Netlify form detection, spam filtering and the owner's configured email delivery still require a redeploy and the hosted checks in the setup tutorial. No live submission or email was sent during implementation.

## Design update — 14 October 2026

- 44 automated tests pass, including repair/development routing, keyboard tabs, mobile menu dismissal, rendered public-page/receipt/confirmation copy, optional portfolio banner dismissal and legacy payment-copy normalization. The rendered-copy guard runs in the production build.
- ESLint, Prettier, the production Vite build, Netlify Function bundling and local SQL integrity/least-privilege checks pass.
- Browser checks cover `/`, `/shop`, `/services`, `/services/development`, `/book`, `/quote`, `/about`, `/privacy`, `/terms`, empty cart and populated checkout at 320, 768 and 1280 pixels. All have document width equal to client width, with no horizontal overflow. See `layout-results.json`.
- Visually inspected development layouts at each requested width and saved desktop/mobile-menu screenshots. Verified menu Escape restores toggle focus, closed items are inert, and the transparent backdrop dismisses the menu. Inspected the loaded reduced-motion CSS: hamburger, panel and item transitions are disabled under the media query. The browser API did not provide an OS motion-preference override.
- `/qa/site.html?page=/services/development` uses the real App with in-memory API fixtures and a MemoryRouter, like the existing isolated admin fixture. Neither QA entry is a Vite production build input. No hosted order, inquiry, inventory or settings writes were made during these checks. Direct URL persistence is additionally covered by route tests; hosted refresh/rewrite verification remains in the launch checklist.
- Current design changes require no database migration. Existing custom payment instructions are preserved. The exact obsolete default instruction from the earlier seed is normalized for public/admin settings reads.
- The owner must still supply the revised shop prototype, verify real inventory/payment/hours and finalize the policy drafts. GitHub push and Netlify publication were not performed in this change.

## Earlier migration verification

- The frontend production build, local PostgreSQL schema/seed, least-privilege role checks and function-handler security tests pass without hosted credentials. The Netlify production Functions archive builds successfully.
- 32 automated tests cover frontend behavior, server pricing, stock, hidden products, simultaneous last-unit requests through the local adapter, malformed/oversized/honeypot input, public setting allowlists, all admin auth gates, CSRF, generic login throttling, token tampering and image signing/metadata checks.
- Function database tests use PGlite (one serialized local PostgreSQL connection) and provider mocks. They do not replace a multi-session test on a configured Neon development branch.
- The original component layouts and routes are preserved. Previous public/admin responsive checks covered 320/768/1280 pixels. The isolated admin layout fixture does not ship to production.
- Netlify Dev started Vite locally, but this Windows environment rejected the CLI's dependency symlinks with EPERM. This is an operating-system development-tool limitation; it is documented in the setup tutorial. No system settings were changed.
- Hosted Neon connection/migration, real production login, Cloudinary upload/cleanup, GitHub push and Netlify deployment remain account setup steps because credentials were not supplied.
- No payment gateway was added. No card data is collected. Products, prices and stock remain sample data; operating days remain unconfirmed.
