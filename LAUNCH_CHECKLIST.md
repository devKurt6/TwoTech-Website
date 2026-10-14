# Two Tech launch checklist

Removing development notices does not verify inventory, payment arrangements or business policies. Complete these items before accepting customer orders.

- [ ] Replace or hide all 16 seed products, prices, stock counts, descriptions and specifications with actual inventory. Upload real product photos through Admin → Products.
- [ ] Confirm every service starting price in `src/data/services.js`. Prices marked * remain estimates subject to inspection, device condition, parts and agreed scope. Confirm supported service modes and GPU-model suitability.
- [ ] Confirm the 9 AM–8 PM hours and actual operating days in Admin → Settings. Check phone, email, address, founder bio, announcement and headline.
- [ ] Confirm the supplied `/public/logo.png` is the final approved logo; replace it if needed.
- [ ] Enter verified Bank/GCash instructions and the delivery fee in Settings. Confirm delivery coverage, payment deadlines and reservation policy. Never request card details.
- [ ] Review and finalize `/privacy` and `/terms` (text in `src/data/policies.js`). Complete retention, data-request handling, provider/delivery arrangements, cancellation, returns, refunds and device-handling placeholders. These drafts make no legal compliance claim.
- [ ] Configure production Netlify environment variables: `DATABASE_URL`, `JWT_SECRET`, Cloudinary cloud name/API key/API secret, optional public `VITE_CLOUDINARY_CLOUD_NAME`, and final HTTPS `SITE_URL`. Include Functions scope for server values. Keep owner-only `MIGRATION_DATABASE_URL` local. Never commit `.env` or secrets.
- [ ] Leave `VITE_DEMO_MODE` unset or `false` for the business site, then redeploy. Portfolio mode changes copy only; it does not disable database writes. Use a separate database for that mode.
- [ ] Apply required database migrations on the same Neon branch/database used by Netlify. Never reset a live database or reinitialize it with the fresh-setup SQL.
- [ ] Create the owner admin using `npm run create-admin` with a unique strong password (12+ characters), then sign in at `/admin/login`. Verify logout and rejected unauthenticated admin API access.
- [ ] Test one order end to end: server-calculated total, correct stock decrement, item quantities, fee, reference and admin Inbox. Test insufficient stock and a repeated submission without double-decrementing stock. Clean up test records and reconcile stock.
- [ ] Test manual transfer: order remains `awaiting_payment`; mark paid only after independently verifying funds. Test cash separately. Confirm the owner-approved next steps appear at checkout and on the receipt.
- [ ] Test one booking end to end; confirm its reference, Inbox entry and the message that the schedule is a request until confirmed.
- [ ] Test one quotation request and one contact message end to end, including Inbox status/notes. Confirm quotations require review first.
- [ ] In Netlify → Forms, enable form detection and redeploy. Confirm `bookings`, `quotes`, `messages` and `orders` are detected. Configure the email notification for any form or each of those names. For each test submission, compare the saved reference in Admin Inbox, Netlify verified submissions and your email; also check spam. Review retention/access for Netlify and email copies.
- [ ] Test image upload/replacement/removal, hiding a product, stock changes and updated Settings on the public site. Allow for public-read caching on other visitors' browsers.
- [ ] Check 320px, 768px and 1280px layouts, keyboard focus, Escape/outside-tap menu dismissal, reduced motion, network retry and form error messages.
- [ ] Directly refresh `/services/development`, `/shop`, `/book`, `/privacy` and `/admin/login` on Netlify. Confirm sitemap URLs, production domain and admin noindex.
- [ ] Supply the revised shop prototype HTML when available; it was not included with the design-change text. The existing reference file has been preserved.

Verification commands: `npm run lint`, `npm test`, `npm run test:db`, `npm run build`, `npm run format:check`. Local fixtures do not verify hosted account configuration or real payment transfers.
