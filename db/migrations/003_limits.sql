create function public.reserve_login(login_email text,client_ip text) returns boolean language plpgsql security invoker set search_path='' as $$
declare attempts int;
begin
 perform pg_advisory_xact_lock(74018201);
 delete from public.login_attempts where created_at < now()-interval '1 day';
 select count(*) into attempts from public.login_attempts where created_at>now()-interval '15 minutes' and (email=login_email or ip=client_ip);
 if attempts>=5 then return false;end if;
 insert into public.login_attempts(email,ip) values(login_email,client_ip);
 return true;
end $$;
create function public.consume_limit(key text,max_hits int) returns boolean language plpgsql security invoker set search_path='' as $$
declare count_hits int;
begin
 delete from public.rate_limits where window_start < now()-interval '1 day';
 insert into public.rate_limits(bucket,hits,window_start) values(key,1,now())
 on conflict(bucket) do update set hits=case when rate_limits.window_start<now()-interval '1 minute' then 1 else rate_limits.hits+1 end,window_start=case when rate_limits.window_start<now()-interval '1 minute' then now() else rate_limits.window_start end returning hits into count_hits;
 return count_hits<=max_hits;
end $$;
revoke all on all functions in schema public from public;
revoke create on schema public from public;
