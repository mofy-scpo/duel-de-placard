export const weights = [40,25,15,10,10];
export const criteria = ['Nutri-Score','indice NOVA','additifs','sucres','gras saturés'];
export function number(v) { return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v)>=0 ? Number(v) : null; }
export function parts(p) {
 const n=p?.nutriments||{}, grade=String(p?.nutriscore_grade||'').toLowerCase(), nova=number(p?.nova_group), additives=number(p?.additives_n), sugar=number(n.sugars_100g), fat=number(n['saturated-fat_100g']);
 return [/^[a-e]$/.test(grade)?({a:40,b:30,c:20,d:10,e:0})[grade]:null,[1,2,3,4].includes(nova)?({1:25,2:18,3:8,4:0})[nova]:null,additives===null?null:additives===0?15:additives<=2?10:additives<=5?5:0,sugar===null?null:sugar<5?10:sugar<=15?6:sugar<=30?3:0,fat===null?null:fat<1.5?10:fat<=5?6:fat<=10?3:0];
}
export function score(p) { const values=parts(p), available=values.reduce((s,v,i)=>s+(v===null?0:weights[i]),0); return {value:available?Math.round(values.reduce((s,v)=>s+(v||0),0)/available*100):null,available,count:values.filter(v=>v!==null).length}; }
export function comparison(a,b,higher=false) { a=number(a);b=number(b); return a===null||b===null||a===b?null:(higher?a>b:a<b)?0:1; }
// Common 0–100 axes for the radar, independent of the opponent.
// Missing information stays null: it must never be drawn as a zero.
export function radarValues(p) { return parts(p).map((value, i) => value === null ? null : value / weights[i] * 100); }
export function scoreBreakdown(p) { const values = parts(p); return {rows: values.map((points, i) => ({label: criteria[i], points, max: weights[i]})), earned: values.reduce((sum, value) => sum + (value ?? 0), 0), ...score(p)}; }
