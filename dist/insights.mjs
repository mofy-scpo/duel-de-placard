import {parts, weights, radarValues, scoreBreakdown, number} from './logic.mjs';
import {radarSVG} from './radar.mjs';
const $ = id => document.getElementById(id);
const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = ['Nutri-Score','NOVA','Additifs','Sucres','Gras saturés'];
const format = value => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(value);
let products = [null,null], visible = [true,true];
function raw(p,i) {
 if (!p) return 'N/A';
 if(i===0)return /^[a-e]$/i.test(p.nutriscore_grade||'')?'Lettre '+p.nutriscore_grade.toUpperCase():'N/A';
 if(i===1)return [1,2,3,4].includes(number(p.nova_group))?'Groupe '+p.nova_group:'N/A';
 const value = number(i===2?p.additives_n:p.nutriments?.[i===3?'sugars_100g':'saturated-fat_100g']);
 return value===null?'N/A':format(value)+(i===2?' additif'+(value>1?'s':''):' g / 100 g');
}
export function openLearning(panel,term) {
 const target = $('learning-'+panel); if(!target)return;
 $('method-dialog').close();
 document.querySelectorAll('[data-learning-tab]').forEach(button=>{const active=button.dataset.learningTab===panel;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
 document.querySelectorAll('[data-learning-panel]').forEach(el=>el.hidden=el.dataset.learningPanel!==panel);
 if(term){const detail=$('term-'+term);if(detail){detail.open=true;detail.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});detail.querySelector('summary')?.focus({preventScroll:true});return;}}
 $('learning').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 $('learning-tab-'+panel).focus({preventScroll:true});
}
export function initLearning() {
 const tabs=[...document.querySelectorAll('[data-learning-tab]')];
 for(const [index,button] of tabs.entries()){
  button.addEventListener('click',()=>openLearning(button.dataset.learningTab));
  button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();openLearning(tabs[next].dataset.learningTab);}});
 }
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-term],[data-open-learning]');if(trigger){if(trigger.dataset.term)openLearning('glossary',trigger.dataset.term);else openLearning(trigger.dataset.openLearning);}});
}
export function renderLearning(nextProducts) {
 products = nextProducts.slice();
 const names=products.map((p,i)=>p?.product_name||'Produit '+(i+1));
 const scores=products.map(scoreBreakdown);
 $('radar-controls').innerHTML=names.map((name,i)=>`<button class="radar-toggle radar-toggle-${i}" aria-pressed="${visible[i]}" data-series="${i}"><span class="series-swatch series-${i}"></span><span>${escape(name)}</span><span class="toggle-state">${visible[i]?'Affiché':'Masqué'}</span></button>`).join('');
 $('radar-controls').querySelectorAll('[data-series]').forEach(button=>button.onclick=()=>{visible[+button.dataset.series]=!visible[+button.dataset.series];renderLearning(products);});
 $('radar-chart').innerHTML=radarSVG(products.map((p,i)=>({name:names[i],values:radarValues(p),visible:visible[i]})));
 const missing=products.map((p,i)=>{const unknown=parts(p).map((v,j)=>v===null?labels[j]:null).filter(Boolean);return unknown.length?`${names[i]} : ${unknown.join(', ')} non renseigné${unknown.length>1?'s':''}.`:'';}).filter(Boolean);
 $('radar-status').textContent=visible.every(v=>!v)?'Les deux tracés sont masqués. Cliquez sur un nom pour le réafficher.':missing.length?missing.join(' ')+' Ces axes restent sans point, ils ne valent pas zéro.':'Les cinq composantes sont renseignées pour les deux produits.';
 $('radar-table').innerHTML=`<table><caption>Valeurs des axes, de 0 à 100 (indépendantes de la pondération)</caption><thead><tr><th scope="col">Axe</th>${names.map(n=>`<th scope="col">${escape(n)}</th>`).join('')}</tr></thead><tbody>${labels.map((label,i)=>`<tr><th scope="row">${label}</th>${products.map(p=>`<td>${radarValues(p)[i]===null?'N/A':format(radarValues(p)[i])+' / 100'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 $('score-details').innerHTML=`<div class="table-scroll"><table class="breakdown-table"><caption>Points obtenus dans le duel en cours</caption><thead><tr><th scope="col">Critère · poids maximal</th>${names.map((n,i)=>`<th scope="col"><span class="series-swatch series-${i}"></span>${escape(n)}</th>`).join('')}</tr></thead><tbody>${labels.map((label,i)=>`<tr><th scope="row"><span class="weight-dot weight-${i}"></span>${label}<small>${weights[i]} points</small></th>${scores.map((s,j)=>`<td><strong>${s.rows[i].points===null?'N/A':s.rows[i].points+'<span> / '+weights[i]+' pts</span>'}</strong><span class="contribution-bar"><span class="weight-${i}" style="width:${s.rows[i].points===null?0:s.rows[i].points/weights[i]*100}%"></span></span><small>${escape(raw(products[j],i))}</small></td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr><th scope="row">Score global<small>Normalisé et arrondi</small></th>${scores.map(s=>`<td><strong>${s.value===null?'N/A':s.value+'<span> / 100</span>'}</strong><small>${s.available?s.earned+' ÷ '+s.available+' × 100':'Aucun critère disponible'}</small></td>`).join('')}</tr></tfoot></table></div><div class="coverage-note">${scores.map((s,i)=>`<p><strong>${escape(names[i])}</strong> : ${s.count}/5 critères disponibles, soit ${s.available} points de pondération utilisables.</p>`).join('')}</div>`;
}
