import fs from 'node:fs';
const write=(p,s)=>{fs.mkdirSync(p.substring(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,s)};
const source=fs.readFileSync('reference/shop-prototype.html','utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b));
write('src/lib/html.js',"import React from 'react'; import htm from 'htm'; export const html=htm.bind(React.createElement);\n");
write('src/lib/format.js',"export const P=n=>'₱'+Number(n).toLocaleString('en-PH');\n");
write('src/data/products.js',between('const CATS=','const SVC=').replaceAll('const CATS=','export const CATS=').replaceAll('const CI=','export const CI=').replaceAll('const PRODUCTS=','export const PRODUCTS='));
write('src/data/services.js',between('const SVC=','const NAV=').replace('const SVC=','export const SVC=').replace('const BOOKABLE=','export const BOOKABLE='));
write('src/components/prototype.jsx',"import {useState,useEffect,useRef} from 'react'; import {html} from '../lib/html'; import {P} from '../lib/format'; import {CI} from '../data/products';\n"+between('const IC=','/* ---------- Mock data').replace('const I=','export const I=')+between('const NAV=','/* ---------- Header').replace(/const (NAV|ref|Demo|Pic|Field|Modal|Done|Head)=/g,'export const $1='));
const imports="import {useState,useEffect,useMemo} from 'react'; import {html} from '../lib/html'; import {P} from '../lib/format'; import {CATS,PRODUCTS} from '../data/products'; import {SVC,BOOKABLE} from '../data/services'; import {I,Demo,Pic,Field,Modal,Done,Head,ref} from '../components/prototype';\n";
for(const [name,start,end] of [['Home','const Home=','/* ---------- Shop'],['Shop','const Shop=','const Detail='],['ProductDetail','const Detail=','/* ---------- Services'],['Services','const Services=','/* ---------- Booking'],['Book','const Booking=','/* ---------- Custom project'],['Quote','const Project=','/* ---------- Cart'],['Cart','const Cart=','/* ---------- About'],['About','const About=','/* ---------- App']]){
 let code=between(start,end).replace(start,start.replace('const ','export const '));
 if(name==='Home')code=code.replace('({go,add,view})','({go,add,view,products=PRODUCTS,settings})').replace('Your Partner in IT Solutions, Repairs & Custom Development.','${settings.headline}').replace('${[1,5,7,9].map(i=>html`<${PCard} key=${i} p=${PRODUCTS[i-1]}','${products.filter(p=>p.stock>0).slice(0,4).map(p=>html`<${PCard} key=${p.id} p=${p}');
 if(name==='Shop')code=code.replace('({add,view})','({add,view,products=PRODUCTS})').replace('PRODUCTS.filter','products.filter').replace('[q,c,max,sort]','[q,c,max,sort,products]');
 if(['Home','Shop'].includes(name))code="import {PCard} from '../components/ProductCard';\n"+code;
 write('src/pages/'+name+'.jsx',imports+code);
}
write('src/components/ProductCard.jsx',imports.replaceAll("'../components/prototype'","'./prototype'")+between('const PCard=','const Shop=').replace('const PCard=','export const PCard='));
const style=source.match(/<style>([\s\S]*?)<\/style>/)[1];
write('src/styles.css','@tailwind base;\n@tailwind components;\n@tailwind utilities;\n'+style+'\nbutton:disabled{opacity:.6;cursor:not-allowed} button,a,input,select,textarea{max-width:100%} input,select,textarea{min-width:0} .bx{background:#fef2f2;color:#b91c1c} body{overflow-x:visible} .card{min-width:0} p,dd{overflow-wrap:anywhere}\n');
write('public/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#111"/><text x="8" y="44" fill="#F7B52C" font-size="36" font-family="sans-serif" font-weight="bold">TT</text></svg>');
write('public/_redirects','/* /index.html 200\n');
