alter table public.orders add column request_id uuid unique;
create function public.place_order(customer jsonb,items jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 line record; product public.products%rowtype; existing public.orders%rowtype;
 order_id uuid; checkout_id uuid; subtotal numeric(10,2):=0; fee numeric(10,2):=0; total numeric(10,2); reference text;
 normalized_phone text; shipping text; payment text;
begin
 if jsonb_typeof(customer) is distinct from 'object' or jsonb_typeof(items) is distinct from 'array' then raise exception 'Invalid checkout payload';end if;
 if jsonb_array_length(items) not between 1 and 100 then raise exception 'Your cart must contain 1–100 items';end if;
 if coalesce(char_length(trim(customer->>'name')),0) not between 1 and 150 or coalesce(char_length(customer->>'email'),0) not between 3 and 254 or (customer->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid name and email';end if;
 normalized_phone:=regexp_replace(coalesce(customer->>'phone',''),'[[:space:]-]','','g');
 if normalized_phone !~ '^(\+63|0)9[0-9]{9}$' then raise exception 'Enter a valid PH mobile number';end if;
 shipping:=customer->>'delivery_method';payment:=customer->>'payment_method';
 if shipping is null or shipping not in ('pickup','delivery') or payment is null or payment not in ('cash','manual_transfer') then raise exception 'Choose a valid delivery and payment method';end if;
 if coalesce(char_length(customer->>'address'),0)>1000 or (shipping='delivery' and coalesce(char_length(trim(customer->>'address')),0)<8) then raise exception 'Enter a full delivery address';end if;
 if coalesce(customer->>'request_id','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then raise exception 'Missing checkout request ID';end if;
 checkout_id:=(customer->>'request_id')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(checkout_id::text,0));
 select * into existing from public.orders o where o.request_id=checkout_id;
 if found then
   if existing.email<>trim(customer->>'email') or existing.phone<>normalized_phone then raise exception 'Checkout request ID already used';end if;
   return jsonb_build_object('ref',existing.ref,'total',existing.total);
 end if;
 for line in select value from jsonb_array_elements(items) loop
   if jsonb_typeof(line.value) is distinct from 'object' or coalesce(line.value->>'productId','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' or coalesce(line.value->>'qty','') !~ '^[1-9][0-9]{0,2}$' then raise exception 'Invalid product or quantity';end if;
 end loop;
 -- Lock in UUID order to avoid deadlocks between differently ordered carts.
 for line in select (value->>'productId')::uuid id,sum((value->>'qty')::int)::int qty from jsonb_array_elements(items) group by 1 order by 1 loop
   if line.qty>999 then raise exception 'Quantity is too large';end if;
   select * into product from public.products p where p.id=line.id for update;
   if not found or not product.visible then raise exception 'A product is no longer available. Refresh your cart';end if;
   if product.stock<line.qty then raise exception 'Insufficient stock for %. Refresh your cart',product.name;end if;
   subtotal:=subtotal+product.price*line.qty;
 end loop;
 if shipping='delivery' then select coalesce((s.data->>'delivery_fee')::numeric,150) into fee from public.settings s where s.id=1;fee:=coalesce(fee,150);end if;
 if fee<0 then raise exception 'Delivery fee is not configured correctly';end if;
 total:=subtotal+fee;
 insert into public.orders(customer_name,email,phone,delivery_method,address,payment_method,subtotal,delivery_fee,total,status,request_id)
 values(trim(customer->>'name'),trim(customer->>'email'),normalized_phone,shipping,case when shipping='delivery' then trim(customer->>'address') else null end,payment,subtotal,fee,total,case when payment='manual_transfer' then 'awaiting_payment' else 'new' end,checkout_id)
 returning id,ref into order_id,reference;
 for line in select (value->>'productId')::uuid id,sum((value->>'qty')::int)::int qty from jsonb_array_elements(items) group by 1 order by 1 loop
   select * into product from public.products p where p.id=line.id;
   insert into public.order_items(order_id,product_id,name,unit_price,qty) values(order_id,product.id,product.name,product.price,line.qty);
   update public.products set stock=stock-line.qty where id=product.id;
 end loop;
 return jsonb_build_object('ref',reference,'total',total);
end $$;
revoke all on function public.place_order(jsonb,jsonb) from public;
grant execute on function public.place_order(jsonb,jsonb) to anon,authenticated;
create function public.validate_booking_service() returns trigger language plpgsql set search_path='' as $$
declare valid_mode boolean;
begin
 valid_mode := case
 when new.service in ('Custom PC assembly','Parts compatibility assessment','RAM & SSD upgrades','GPU installation','Operating system & driver setup','No-display & boot issue diagnosis','Overheating & sudden shutdown','Slow computer troubleshooting','Hardware & software diagnosis','System unit deep cleaning','CPU thermal paste replacement','GPU cleaning & thermal paste','Thermal pad inspection/replacement where appropriate') then new.mode in ('Drop-off','Onsite')
 when new.service in ('Windows installation/reinstallation','Computer formatting','Driver installation','Licensed software setup','Malware removal','Data backup before formatting') then new.mode in ('Drop-off','Onsite','Remote')
 when new.service in ('Router & Wi-Fi setup','LAN troubleshooting','Printer setup','File sharing setup','Remote & onsite technical support') then new.mode in ('Onsite','Remote')
 else false end;
 if not valid_mode then raise exception 'Choose a valid service and supported mode';end if;return new;
end $$;
create trigger booking_service before insert or update on public.bookings for each row execute function public.validate_booking_service();
-- Return only the new reference while preserving the public SELECT prohibition.
create function public.submit_request(kind text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare reference text;normalized_phone text;
begin
 if jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid request';end if;
 normalized_phone:=regexp_replace(coalesce(payload->>'phone',''),'[[:space:]-]','','g');
 if kind='bookings' then
   if (payload->>'preferred_date')::date < (now() at time zone 'Asia/Manila')::date then raise exception 'Choose today or a later date';end if;
   insert into public.bookings(name,email,phone,service,device,problem,preferred_date,preferred_time,mode,address) values(trim(payload->>'name'),trim(payload->>'email'),normalized_phone,payload->>'service',trim(payload->>'device'),trim(payload->>'problem'),(payload->>'preferred_date')::date,payload->>'preferred_time',payload->>'mode',nullif(trim(payload->>'address'),'')) returning ref into reference;
 elsif kind='quotes' then
   insert into public.quotes(name,email,phone,category,title,requirements,hardware,budget,target_date,reference_link) values(trim(payload->>'name'),trim(payload->>'email'),normalized_phone,payload->>'category',trim(payload->>'title'),trim(payload->>'requirements'),payload->>'hardware',payload->>'budget',nullif(payload->>'target_date','')::date,nullif(payload->>'reference_link','')) returning ref into reference;
 elsif kind='messages' then
   insert into public.messages(name,email,body) values(trim(payload->>'name'),trim(payload->>'email'),trim(payload->>'body')) returning ref into reference;
 else raise exception 'Unknown request type';end if;
 return jsonb_build_object('ref',reference);
end $$;
revoke all on function public.submit_request(text,jsonb) from public;
grant execute on function public.submit_request(text,jsonb) to anon,authenticated;
