# Verification after the Neon migration

- The frontend production build, local PostgreSQL schema/seed, least-privilege role checks and function-handler security tests pass without hosted credentials. The Netlify production Functions archive builds successfully.
- 32 automated tests cover frontend behavior, server pricing, stock, hidden products, simultaneous last-unit requests through the local adapter, malformed/oversized/honeypot input, public setting allowlists, all admin auth gates, CSRF, generic login throttling, token tampering and image signing/metadata checks.
- Function database tests use PGlite (one serialized local PostgreSQL connection) and provider mocks. They do not replace a multi-session test on a configured Neon development branch.
- The original component layouts and routes are preserved. Previous public/admin responsive checks covered 320/768/1280 pixels. The isolated admin layout fixture does not ship to production.
- Netlify Dev started Vite locally, but this Windows environment rejected the CLI's dependency symlinks with EPERM. This is an operating-system development-tool limitation; it is documented in the setup tutorial. No system settings were changed.
- Hosted Neon connection/migration, real production login, Cloudinary upload/cleanup, GitHub push and Netlify deployment remain account setup steps because credentials were not supplied.
- No payment gateway was added. No card data is collected. Products, prices and stock remain sample data; operating days remain unconfirmed.
