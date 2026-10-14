import {supabase,requireDatabase,configured} from './supabase';import {PRODUCTS} from '../data/products';import {defaults} from '../data/settings';
export const demo=!configured;
async function result(query){const {data,error}=await query;if(error)throw new Error(error.message);return data;}
export function imageURL(path){return path&&supabase?supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl:null;}
export const normalizeProduct=p=>({...p,cat:p.category??p.cat,desc:p.description??p.desc,img:imageURL(p.image_path)});
export const api={
 products:async(all=false)=>{if(!configured){if(all)throw new Error('Connect Supabase to manage products.');return PRODUCTS.map(p=>({...p,visible:true}));}let q=supabase.from('products').select('*').order('created_at');if(!all)q=q.eq('visible',true);return (await result(q)).map(normalizeProduct);},
 settings:async()=>configured?{...defaults,...(await result(supabase.from('settings').select('data').eq('id',1).single())).data}:defaults,
 saveSettings:async data=>{await result(requireDatabase().from('settings').upsert({id:1,data}));window.dispatchEvent(new Event('tt-refresh'));},
 saveProduct:async p=>{const {id,name,cat,price,stock,desc,specs,image_path,visible}=p;const row={name:name.trim(),category:cat,price:Number(price),stock:Number(stock),description:desc||'',specs:specs||'',image_path:image_path||null,visible};await result(id?requireDatabase().from('products').update(row).eq('id',id):requireDatabase().from('products').insert(row));window.dispatchEvent(new Event('tt-refresh'));},
 deleteProduct:async id=>{await result(requireDatabase().from('products').delete().eq('id',id));window.dispatchEvent(new Event('tt-refresh'));},
 uploadImage:async file=>{if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>2097152)throw new Error('Choose a JPEG, PNG, WebP or GIF image up to 2 MB.');const path=crypto.randomUUID()+'.'+({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'}[file.type]);await result(requireDatabase().storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false}));return path;},
 removeImage:async path=>{if(path)await result(requireDatabase().storage.from('product-images').remove([path]));},
 inbox:async table=>result(requireDatabase().from(table).select(table==='orders'?'*,order_items(*)':'*').order('created_at',{ascending:false})),
 updateRecord:async(table,id,patch)=>result(requireDatabase().from(table).update(patch).eq('id',id)),
 login:async(email,password)=>result(requireDatabase().auth.signInWithPassword({email,password})),
 logout:async()=>result(requireDatabase().auth.signOut()),
 admin:async()=>Boolean(await result(requireDatabase().rpc('is_admin'))),
 submit:async(kind,payload)=>{if(!configured)return {ref:'DEMO-'+kind.slice(0,3).toUpperCase()+'-'+crypto.randomUUID().slice(0,8).toUpperCase()};return result(supabase.rpc('submit_request',{kind,payload}));},
 placeOrder:async(customer,items)=>{if(!configured){const products=await api.products();const total=items.reduce((n,i)=>{const p=products.find(p=>p.id===i.productId);if(!p||i.qty>p.stock)throw new Error('Stock changed. Refresh your cart.');return n+p.price*i.qty},0)+(customer.delivery_method==='delivery'?defaults.delivery_fee:0);return {ref:'DEMO-ORD-'+crypto.randomUUID().slice(0,8).toUpperCase(),total};}return result(supabase.rpc('place_order',{customer,items}));},
};
