-- Run as the migration owner. Optional least-privilege runtime role.
-- Set its login password privately in Neon; do not commit a password here.
do $$ begin if not exists(select 1 from pg_roles where rolname='two_tech_app') then create role two_tech_app login nosuperuser nocreatedb nocreaterole noinherit;end if;end $$;
grant usage on schema public to two_tech_app;
grant select,insert,update,delete on public.products,public.settings,public.orders,public.order_items,public.bookings,public.quotes,public.messages to two_tech_app;
grant select on public.admin_users to two_tech_app;
grant select,insert,delete on public.login_attempts to two_tech_app;
grant select,insert,update,delete on public.rate_limits to two_tech_app;
grant usage,select on all sequences in schema public to two_tech_app;
grant execute on function public.make_ref(text),public.touch_updated_at(),public.place_order(jsonb,jsonb),public.validate_booking_service(),public.reserve_login(text,text),public.consume_limit(text,int) to two_tech_app;
