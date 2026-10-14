# Database setup

Create a Supabase project, then run the migrations in filename order using the SQL editor. Alternatively install the Supabase CLI, run `supabase link --project-ref YOUR_REF`, then `supabase db push`. Seed only a test/empty catalog with `supabase/seed.sql` (SQL editor or `psql "$DATABASE_URL" -f supabase/seed.sql`). The seed prices and stock are sample data, not sale-ready inventory.

Create the owner via Supabase Authentication → Users → Add user. Copy the UUID, then run `insert into public.admins(user_id) values ('THE_AUTH_USER_UUID');` from the SQL editor. No browser can add admins. Enable appropriate Auth rate limits and disable public signup when only the owner needs an account.

The browser uses the project URL and anon/publishable key only. Never supply a service-role key. Storage uses a public `product-images` bucket with admin-only mutations. No secrets belong in public settings.

The local integration harness creates Supabase-compatible auth/storage stubs in an isolated PostgreSQL engine and runs these actual migrations and seed. It validates SQL permissions and transactions; it does not emulate hosted Storage upload MIME enforcement or Auth email delivery.
