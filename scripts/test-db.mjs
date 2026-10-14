import {PGlite} from '@electric-sql/pglite';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth,storage to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant all on storage.objects to authenticated;grant select on storage.objects to anon;`);
for(const file of fs.readdirSync('supabase/migrations').sort())await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
await db.exec(fs.readFileSync('supabase/seed.sql','utf8'));
assert.equal((await db.query('select count(*)::int n from public.products')).rows[0].n,16);
await db.exec("update public.products set visible=false where id='00000000-0000-4000-8000-000000000001';set role anon;");
assert.equal((await db.query('select count(*)::int n from public.products')).rows[0].n,15);
async function denied(sql){await assert.rejects(()=>db.exec(sql));}
await denied('select * from public.orders');await denied("insert into public.products(name,category,price) values('Hacked','RAM',1)");await denied("insert into public.messages(name,email,body,handled) values('Spam','s@a.ph','A long enough message',true)");
await db.exec("insert into public.messages(name,email,body) values('Customer','a@b.ph','A legitimate inquiry');reset role;set role authenticated;select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);");
assert.equal((await db.query('select * from public.messages')).rows.length,0);
await denied("insert into public.products(name,category,price) values('Hacked','RAM',1)");
await db.exec("reset role;insert into auth.users values('22222222-2222-4222-8222-222222222222');insert into public.admins values('22222222-2222-4222-8222-222222222222');set role authenticated;select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);");
assert.equal((await db.query('select * from public.messages')).rows.length,1);
await db.exec("update public.products set visible=true where id='00000000-0000-4000-8000-000000000001';reset role;");
console.log('PASS: migrations, 16 seeds, product visibility, anonymous permissions, forced defaults, non-admin isolation and admin access');
await db.close();
