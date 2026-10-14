create table public.admins (user_id uuid primary key references auth.users on delete cascade);
create function public.is_admin() returns boolean language sql security definer stable set search_path = '' as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
create function public.make_ref(prefix text) returns text language sql volatile set search_path = '' as $$ select prefix || '-' || upper(replace(gen_random_uuid()::text,'-','')) $$;
create table public.products (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(name) between 2 and 150),
 category text not null check(category in ('Processors','Motherboards','RAM','SSD & HDD','Graphics Cards','Power Supplies','PC Cases','Cooling','Peripherals')),
 price numeric(10,2) not null check(price>0), stock integer not null default 0 check(stock>=0),
 description text not null default '' check(char_length(description)<=5000), specs text not null default '' check(char_length(specs)<=5000), image_path text,
 visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.orders (
 id uuid primary key default gen_random_uuid(), ref text unique not null default public.make_ref('ORD'),
 customer_name text not null check(char_length(trim(customer_name)) between 1 and 150), email text not null check(char_length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone text not null check(phone ~ '^(\+63|0)9[0-9]{9}$'), delivery_method text not null check(delivery_method in ('pickup','delivery')), address text check(char_length(address)<=1000),
 payment_method text not null check(payment_method in ('cash','manual_transfer')),
 subtotal numeric(10,2) not null check(subtotal>0), delivery_fee numeric(10,2) not null default 0 check(delivery_fee>=0), total numeric(10,2) not null check(total=subtotal+delivery_fee),
 status text not null default 'new' check(status in ('new','awaiting_payment','paid','processing','ready','completed','cancelled')),
 notes text check(char_length(notes)<=5000), created_at timestamptz not null default now(),
 check(delivery_method<>'delivery' or char_length(trim(address))>=8));
create table public.order_items (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders on delete cascade,product_id uuid references public.products on delete set null,
 name text not null,unit_price numeric(10,2) not null check(unit_price>0),qty integer not null check(qty>0));
create table public.bookings (
 id uuid primary key default gen_random_uuid(),ref text unique not null default public.make_ref('BK'),
 name text not null check(char_length(trim(name)) between 1 and 150),email text not null check(char_length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),phone text not null check(phone ~ '^(\+63|0)9[0-9]{9}$'),
 service text not null check(char_length(service) between 1 and 200),device text not null check(char_length(trim(device)) between 1 and 500),problem text not null check(char_length(trim(problem)) between 10 and 5000),
 preferred_date date not null,preferred_time text not null check(preferred_time in ('9:00 AM','11:00 AM','1:00 PM','3:00 PM','5:00 PM')),
 mode text not null check(mode in ('Drop-off','Onsite','Remote')),address text check(char_length(address)<=1000),
 status text not null default 'pending' check(status in ('pending','confirmed','done','cancelled')),admin_notes text check(char_length(admin_notes)<=5000),created_at timestamptz not null default now(),
 check(mode<>'Onsite' or char_length(trim(address))>=8));
create table public.quotes (
 id uuid primary key default gen_random_uuid(),ref text unique not null default public.make_ref('QR'),
 name text not null check(char_length(trim(name)) between 1 and 150),email text not null check(char_length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),phone text not null check(phone ~ '^(\+63|0)9[0-9]{9}$'),
 category text not null check(category in ('Website','Desktop Application','Automation','AI/Image Processing','Embedded Systems/IoT','Other')),
 title text not null check(char_length(trim(title)) between 1 and 200),requirements text not null check(char_length(trim(requirements)) between 20 and 10000),hardware text check(char_length(hardware)<=5000),
 budget text not null check(char_length(budget) between 1 and 150),target_date date,reference_link text check(char_length(reference_link)<=2000 and (reference_link='' or reference_link ~ '^https?://[^[:space:]]+\.[^[:space:]]+')),
 status text not null default 'pending' check(status in ('pending','reviewing','quoted','closed')),admin_notes text check(char_length(admin_notes)<=5000),created_at timestamptz not null default now());
create table public.messages (
 id uuid primary key default gen_random_uuid(),ref text unique not null default public.make_ref('MSG'),name text not null check(char_length(trim(name)) between 1 and 150),
 email text not null check(char_length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),body text not null check(char_length(trim(body)) between 10 and 5000),
 handled boolean not null default false,admin_notes text check(char_length(admin_notes)<=5000),created_at timestamptz not null default now());
create table public.settings (id int primary key default 1 check(id=1),data jsonb not null default '{}' check(jsonb_typeof(data)='object'));
create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end $$;
create trigger products_updated before update on public.products for each row execute function public.touch_updated_at();
alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.bookings enable row level security;
alter table public.quotes enable row level security;
alter table public.messages enable row level security;
alter table public.settings enable row level security;
revoke all on all tables in schema public from anon,authenticated;
grant select on public.admins to authenticated;
create policy admins_read_self on public.admins for select to authenticated using(user_id=auth.uid());
grant select on public.products,public.settings to anon,authenticated;
create policy products_public on public.products for select to anon,authenticated using(visible=true);
create policy settings_public on public.settings for select to anon,authenticated using(true);
grant all on public.products,public.settings,public.orders,public.order_items,public.bookings,public.quotes,public.messages to authenticated;
create policy products_admin on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy settings_admin on public.settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy orders_admin on public.orders for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy items_admin on public.order_items for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy bookings_admin on public.bookings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy quotes_admin on public.quotes for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy messages_admin on public.messages for all to authenticated using(public.is_admin()) with check(public.is_admin());
-- Public can insert only customer columns, never refs, status, timestamps or admin notes.
grant insert(name,email,phone,service,device,problem,preferred_date,preferred_time,mode,address) on public.bookings to anon;
grant insert(name,email,phone,category,title,requirements,hardware,budget,target_date,reference_link) on public.quotes to anon;
grant insert(name,email,body) on public.messages to anon;
create policy bookings_public_insert on public.bookings for insert to anon with check(status='pending' and admin_notes is null and preferred_date >= (now() at time zone 'Asia/Manila')::date);
create policy quotes_public_insert on public.quotes for insert to anon with check(status='pending' and admin_notes is null);
create policy messages_public_insert on public.messages for insert to anon with check(handled=false and admin_notes is null);
create index products_visible_category on public.products(visible,category);
create index orders_status_date on public.orders(status,created_at desc);
create index bookings_status_date on public.bookings(status,created_at desc);
create index quotes_status_date on public.quotes(status,created_at desc);
create index order_items_order on public.order_items(order_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,2097152,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
create policy product_images_read on storage.objects for select to anon,authenticated using(bucket_id='product-images');
create policy product_images_admin_insert on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
create policy product_images_admin_update on storage.objects for update to authenticated using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());
