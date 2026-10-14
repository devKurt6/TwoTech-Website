# Local verification — 14 October 2026

- Production Vite build: passed. Admin is emitted as a separate lazy chunk.
- ESLint: passed; no warnings after fixes.
- Vitest: 10 passing unit/component tests (validators, peso formatting, cart sanitization/reconciliation, image fallback, data retry, booking preselection, checkout retry/idempotency and dialog Escape).
- PostgreSQL/PGlite: migrations and 16 seeds execute; RLS/grants isolate anonymous and non-admin clients; public status injection rejected or ignored; hidden products excluded; admin access works. Order tampering cannot set price, stock or delivery fee. Stock decrement, repeat checkout, overselling rejection, rollback and service/mode validation pass.
- Browser: home, shop, direct product dialog, services, booking, quote, about/contact, empty cart, admin login and 404 render at 320, 768 and 1280 pixels. Document scroll widths do not exceed viewports.
- Browser: isolated admin Dashboard, Products, Inbox and Settings fixtures render at all three widths with no horizontal overflow. At 320 pixels the product editor fits and scrolls; Shift+Tab wraps to Save, Tab wraps to Close, saving returns focus to Edit and updates fixture price.
- Browser: demo cash/manual-transfer checkout offers no card fields, produces an explicit demo reference and clears cart; an RPC network failure is separately covered by the component test without clearing cart.
- User-supplied logo converted to PNG; missing-image fallback checked.

Remaining external verification: hosted Supabase Auth membership/login, hosted Storage upload and MIME/size enforcement, multi-session concurrency load test, real payment instructions, actual inventory, confirmed operating days, and Netlify publication/deep-link/header checks. These require the owner's configured projects. No live deployment or payments were performed.
