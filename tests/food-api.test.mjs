import assert from 'node:assert/strict';
import {FoodClient, FoodError} from '../dist/food-api.mjs';
const start = Date.UTC(2026,10,25,12);
const makeStorage = () => { const map = new Map(); return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}; };
const response = (body,status=200,headers={}) => ({ok:status>=200&&status<300,status,headers:{get:k=>headers[k]||null},json:async()=>body});
const product = {code:'1234567890123',product_name:'Pâte noisette',brands:'Test',nutriscore_grade:'b',additives_n:0,nutriments:{sugars_100g:0}};
function setup(fetcher,storage=makeStorage()) { let time=start;const waits=[];const client=new FoodClient({fetcher,storage,now:()=>time,random:()=>0,pause:async ms=>{waits.push(ms);time+=ms;}});return {client,storage,waits,advance:ms=>time+=ms}; }
// Real results persist across a new client, including zero-valued nutrients.
{
 let calls=0;const env=setup(async()=>{calls++;return response({products:[product]});});
 assert.equal((await env.client.search('noisette')).source,'live');
 const reloaded=new FoodClient({storage:env.storage,now:()=>start,fetcher:()=>{throw Error('must not fetch');}});
 assert.equal((await reloaded.search('NOISETTE')).source,'cache');
 assert.equal((await reloaded.product(product.code)).product.nutriments.sugars_100g,0);
 assert.equal(calls,1);
}
// Same simultaneous query from both selectors performs one call.
{
 let calls=0;const {client}=setup(async()=>{calls++;return response({products:[product]});});
 const [a,b]=await Promise.all([client.search('noisette'),client.search('Noisette')]);
 assert.equal(calls,1);assert.deepEqual(a,b);
}
// Barcode searches use the product endpoint and surface not-found without retries.
{
 const urls=[];const {client}=setup(async url=>{urls.push(url);return response({status:1,product});});
 assert.equal((await client.search(product.code)).products[0].code,product.code);
 assert.match(urls[0],/api\/v2\/product\//);assert.equal(urls.length,1);
 const missing=setup(async()=>response({},404));
 await assert.rejects(missing.client.product(product.code),e=>e.kind==='missing');assert.equal(missing.waits.length,0);
}
// Temporary server failures get one bounded retry, then cached data remains usable.
{
 let calls=0;const env=setup(async()=>{calls++;return response({},503);});
 env.client.remember(product,start-2*86400000);
 const result=await env.client.product(product.code);
 assert.equal(calls,2);assert.equal(env.waits.length,1);assert.equal(result.source,'fallback');
 assert.equal((await env.client.search('noisette')).source,'fallback');
 assert.equal(calls,4);
 // Circuit cooldown blocks immediate additional product calls.
 assert.equal((await env.client.product(product.code)).source,'fallback');assert.equal(calls,4);
}
// HTTP 429 observes Retry-After across reloads; no retry storm.
{
 let calls=0;const env=setup(async()=>{calls++;return response({},429,{'Retry-After':'120'});});
 await assert.rejects(env.client.search('new'),e=>e.kind==='throttled'&&e.retryAt===start+120000);
 const reloaded=new FoodClient({storage:env.storage,now:()=>start,fetcher:async()=>{calls++;return response({products:[]});}});
 await assert.rejects(reloaded.search('other'),e=>e.kind==='throttled');assert.equal(calls,1);
}
// Budget applies to different searches and persists after page reload.
{
 let calls=0;const env=setup(async()=>{calls++;return response({products:[]});});
 for(let i=0;i<8;i++)await env.client.search('query '+i);
 await assert.rejects(env.client.search('ninth'),e=>e.kind==='throttled');assert.equal(calls,8);
 const reloaded=new FoodClient({storage:env.storage,now:()=>start,fetcher:async()=>{calls++;return response({products:[]});}});
 await assert.rejects(reloaded.search('tenth'),e=>e.kind==='throttled');assert.equal(calls,8);
 env.advance(60002);assert.equal((await env.client.search('ninth')).source,'live');
}
// Browser storage restrictions do not break search; successful empty results are cached.
{
 let calls=0;const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 const {client}=setup(async()=>{calls++;return response({products:[]});},blocked);
 assert.deepEqual((await client.search('empty')).products,[]);assert.equal((await client.search('empty')).source,'cache');assert.equal(calls,1);
}
// Malformed replies are not mistaken for an empty search, and sorting prioritizes photos.
{
 const malformed=setup(async()=>response({}));await assert.rejects(malformed.client.search('anything'),FoodError);
 const {client}=setup(async()=>response({products:[{...product,code:'1111111111111'}, {...product,code:'2222222222222',image_front_small_url:'https://example.com/photo.jpg'},{...product,code:'3333333333333',product_name:''}]}));
 const result=await client.search('sorting');assert.equal(result.products.length,2);assert.equal(result.products[0].code,'2222222222222');
}
// User-supplied search keys must not collide with Object prototype properties.
{
 const {client}=setup(async()=>response({products:[]}));
 assert.deepEqual((await client.search('constructor')).products,[]);
 assert.deepEqual((await client.search('__proto__')).products,[]);
}
console.log('Persistent cache, barcode lookup, deduplication, quotas, retry limits and service failures passed.');
