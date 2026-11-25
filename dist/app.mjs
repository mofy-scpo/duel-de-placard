import {number,score,parts,comparison} from './logic.mjs';
import {FoodClient} from './food-api.mjs';
import {initLearning, renderLearning, openLearning} from './insights.mjs';
let browserStorage; try { browserStorage = window.localStorage; } catch {}
const api = new FoodClient({storage: browserStorage});
const paths={jar:'<path d="M8 6h8v3H8zM8 9l-2 3v9h12v-9l-2-3M10 3v3m4-3v3M9 14h6v4H9z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',sparkles:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Zm7-1v4m-2-2h4"/>','check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',swap:'<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',shuffle:'<path d="M3 5h3c5 0 7 14 12 14h3m-4-4 4 4-4 4M3 19h3c2.5 0 4-3 5-6m3-6c1-1 2-2 4-2h3m-4-4 4 4-4 4"/>',link:'<path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0)"/>',chart:'<path d="M4 20V4m0 16h16M9 16v-5m5 5V6m5 10v-7"/>',leaf:'<path d="M20 3C9 2 3 6 5 14s15 7 15-11ZM4 21 15 9"/>',scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M7 7v10m3-10v10m4-10v10m3-10v10"/>',heart:'<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 3 11 8 15 5-4 13-10 8-15Z"/>',shield:'<path d="m12 3 8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',trophy:'<path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a5 5 0 0 0 5 5m9-8h4v3a5 5 0 0 1-5 5M12 14v6m-5 1h10"/>',check:'<path d="m5 12 4 4L19 6"/>',bottle:'<path d="M10 3h4v5l3 4v9H7v-9l3-4V3Zm-3 11h10M10 6h4"/>',bowl:'<path d="M3 11h18a9 9 0 0 1-18 0ZM8 21h8M7 8l2-5m3 5 2-5m3 5 2-5"/>',cookie:'<path d="M20 11a5 5 0 0 1-5-7 9 9 0 1 0 5 7Z"/><path d="M8 8h.01M7 14h.01M12 12h.01M12 18h.01M17 16h.01"/>',sugar:'<path d="m12 3 8 4v10l-8 4-8-4V7l8-4Zm-8 4 8 4 8-4m-8 4v10"/>',drop:'<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>',salt:'<path d="m10 3 7 3-2 4-7-3 2-4ZM8 7 3 19l8 3 5-12M7 14l6 2M19 12v1m2 2v1m-3 1v1"/>',flask:'<path d="M9 3h6m-5 0v6L4 20h16L14 9V3M7 15h10"/>',protein:'<path d="m3 9 3-3 3 3-3 3-3-3Zm12 6 3-3 3 3-3 3-3-3ZM8 11l5 5m-3-7 5 5M2 5l3-3m14 20 3-3"/>'};
const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.jar}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const presets=[{names:['Nutella','Nocciolata'],codes:['3017620422003','8001505005707'],icon:'jar'},{names:['Coca-Cola','Oasis Tropical'],codes:['5449000000996','3124480100016'],icon:'bottle'},{names:['Chocapic',"Flocons d’avoine"],codes:['7613032779566','3168930009078'],icon:'bowl'},{names:['Prince de Lu','Petits Beurre'],codes:['7622210449283','7622210988034'],icon:'cookie'}];
const products=[null,null],loading=[false,false],errors=[null,null],versions=[0,0],provenance=[null,null];
const dateLabel=time=>new Intl.DateTimeFormat('fr-FR').format(new Date(time));
let codes=['',''];
const grade=p=>/^[a-e]$/.test(p?.nutriscore_grade||'')?p.nutriscore_grade.toUpperCase():'N/A';
const gradeBadge=p=>`<span class="grade grade-${grade(p)==='N/A'?'na':grade(p).toLowerCase()}">${grade(p)}</span>`;
const novaLabel={1:'Peu transformé',2:'Ingrédient culinaire',3:'Transformé',4:'Ultra-transformé'};
function fallback(el){el.replaceWith(Object.assign(document.createElement('span'),{className:'placeholder',innerHTML:icon('jar')}));}
function bindImages(root){root.querySelectorAll('img').forEach(img=>{img.addEventListener('error',()=>fallback(img),{once:true});if(img.complete&&!img.naturalWidth)fallback(img);});}
function photo(p,small=false){const bundled=presets.some(preset=>preset.codes.includes(String(p?.code)));const src=bundled?`./assets/${p.code}.jpg`:small?p?.image_front_small_url:p?.image_front_url||p?.image_front_small_url;return (bundled||/^https:\/\//.test(src||''))?`<img src="${esc(src)}" alt="${esc(p?.product_name||'Produit')}" ${small?'loading="lazy"':''}>`:`<span class="placeholder">${icon('jar')}</span>`;}
function renderProduct(i){
 const root=$(`product-${i}`),p=products[i];
 if(loading[i]&&!p){root.innerHTML='<div class="product-card" aria-busy="true" aria-label="Chargement du produit"><div class="skeleton skeleton-line short"></div><div class="skeleton skeleton-image"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div>';return;}
 if(!p){root.innerHTML=`<div class="product-card error-card">${icon('jar')}<strong>${errors[i]?'Petit contretemps…':'À vous de jouer'}</strong><span>${esc(errors[i]||'Recherchez un produit pour lancer le duel.')}</span>${errors[i]?'<button class="retry">Réessayer</button>':''}</div>`;root.querySelector('.retry')?.addEventListener('click',()=>loadProduct(i,codes[i],true));return;}
 const nova=number(p.nova_group),valid=[1,2,3,4].includes(nova);
 root.innerHTML=`<article class="product-card"><div class="product-topline"><span>CHALLENGER ${i+1}</span><a href="https://fr.openfoodfacts.org/produit/${encodeURIComponent(p.code)}" target="_blank" rel="noopener" aria-label="Voir ${esc(p.product_name)} sur Open Food Facts">Fiche produit</a></div><div class="photo-wrap">${photo(p)}</div><h3 class="product-name">${esc(p.product_name||'Produit sans nom')}</h3><p class="product-brand">${esc(p.brands||'Marque non renseignée')}</p><div class="badges"><button class="nutri-badge badge-help" data-term="nutriscore" aria-label="Comprendre le Nutri-Score">NUTRI-SCORE ${gradeBadge(p)}<span aria-hidden="true">ⓘ</span></button><button class="nova-badge badge-help" data-term="nova" aria-label="Comprendre les groupes NOVA"><strong>NOVA ${valid?nova:'N/A'}</strong><span>· ${valid?novaLabel[nova]:'Non renseigné'}</span><span aria-hidden="true">ⓘ</span></button></div></article>${loading[i]?'<p class="loading-note">Actualisation des données…</p>':provenance[i]?`<p class="loading-note">Données OFF du ${dateLabel(provenance[i].time)}${provenance[i].source==='fallback'?' · service indisponible, données conservées':provenance[i].source==='cache'?' · enregistrées sur cet appareil':''} <button class="method-link refresh">Actualiser</button></p>`:''}`;
 root.querySelector('.refresh')?.addEventListener('click',()=>loadProduct(i,codes[i],true));bindImages(root);
}
function renderPresets(){ $('quick-duels').innerHTML=presets.map((p,i)=>`<button class="quick-duel ${p.codes.every(c=>codes.includes(c))?'active':''}" data-index="${i}" aria-pressed="${p.codes.every(c=>codes.includes(c))}"><span class="quick-icon">${icon(p.icon)}</span><span class="quick-text">${p.names[0]}<small><b>vs</b> ${p.names[1]}</small></span></button>`).join('');$('quick-duels').querySelectorAll('button').forEach(b=>b.onclick=()=>launch(presets[+b.dataset.index].codes)); }
function syncURL(replace=false){const u=new URL(location.href);codes.forEach((c,i)=>c?u.searchParams.set(`p${i+1}`,c):u.searchParams.delete(`p${i+1}`));history[replace?'replaceState':'pushState']({},'',u);}
function format(v,unit='g'){v=number(v);return v===null?'N/A':`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(v)}${unit?' '+unit:''}`;}
const metricTerms=['sugars','fat','salt','additives','proteins'];
const metrics=[['Sucres','sugars_100g','sugar'],['Gras saturés','saturated-fat_100g','drop'],['Sel','salt_100g','salt'],['Additifs','additives_n','flask'],['Protéines','proteins_100g','protein']];
function renderComparison(){
 $('comparison').innerHTML=metrics.map(([name,key,symbol],m)=>{
 const values=products.map(p=>key==='additives_n'?number(p?.additives_n):number(p?.nutriments?.[key])),win=comparison(...values,m===4),max=Math.max(...values.map(v=>v||0),.01),unit=m===3?'':'g';
 const cell=i=>`<div class="metric-cell ${i?'right':''} ${win===i?'is-best':''}">${i?'':`<div class="metric-bar"><span style="width:${values[i]===null?0:values[i]/max*100}%"></span></div>`}<span class="metric-value ${win===i?'is-best':''}">${win===i?icon('check-circle'):''}${format(values[i],unit)}${win===i?'<span class="hidden">, meilleur sur ce critère</span>':''}</span>${i?`<div class="metric-bar"><span style="width:${values[i]===null?0:values[i]/max*100}%"></span></div>`:''}</div>`;
 return `<div class="metric-row">${cell(0)}<button class="metric-name metric-help" data-term="${metricTerms[m]}" aria-label="Comprendre : ${name}">${icon(symbol)}${name}<span aria-hidden="true">ⓘ</span></button>${cell(1)}</div>`;
 }).join('');renderVerdict();renderLearning(products);
}
function renderVerdict(){
 if(!products.every(Boolean)){$('verdict').innerHTML='<div class="verdict"><div class="trophy">'+icon('trophy')+'</div><div class="verdict-copy"><span class="verdict-kicker">LE VERDICT SE PRÉPARE</span><h3>Deux produits, et le match commence.</h3><p>Les données disponibles s’afficheront ici dès la sélection des deux produits.</p></div></div>';return;}
 const scores=products.map(score),a=scores[0].value,b=scores[1].value,win=a===null||b===null||a===b?null:a>b?0:1,same=codes[0]===codes[1];
 let title=same?'Match nul parfait : c’est le même produit !':a===null||b===null?'Pas assez de données pour départager.':win===null?'Match nul : le placard hésite !':`${products[win].product_name||'Le produit '+(win+1)} remporte le duel !`;
 let reason='Les deux produits obtiennent le même score selon notre méthode.';
 if(win!==null){const w=parts(products[win]),l=parts(products[1-win]),advantages=w.map((v,i)=>({i,diff:v===null||l[i]===null?0:v-l[i]})).filter(v=>v.diff>0).sort((a,b)=>b.diff-a.diff).slice(0,2),phrases=['un meilleur Nutri-Score','un indice NOVA plus favorable','un meilleur score sur les additifs','un meilleur score sur les sucres','un meilleur score sur les gras saturés'];reason=advantages.length?`L’avantage se joue sur ${advantages.map(v=>phrases[v.i]).join(' et ')}.`:'Le score normalisé sur les données disponibles lui donne l’avantage.';}
 if(same)reason='Même recette, même score. On ne pouvait pas faire plus équitable.';else if(a===null||b===null)reason='Essayez deux produits dont les informations nutritionnelles sont plus complètes.';
 const coverage=scores.map(s=>`${s.count}/5 critères`),different=parts(products[0]).some((v,i)=>(v===null)!==(parts(products[1])[i]===null));
 $('verdict').innerHTML=`<section class="verdict"><div class="trophy">${icon(win===null?'swap':'trophy')}</div><div class="verdict-copy"><span class="verdict-kicker">LE VERDICT DU PLACARD</span><h3>${esc(title)}</h3><p>${esc(reason)}</p></div><div class="scores" aria-label="Scores globaux">${scores.map((s,i)=>`${i?'<div class="score-separator"></div>':''}<div class="score-box ${win===i?'winning':''}"><div class="score-number">${s.value??'N/A'}${s.value===null?'':'<span>/100</span>'}</div><span class="score-name" title="${esc(products[i].product_name)}">${esc(products[i].product_name||'Produit '+(i+1))}</span></div>`).join('')}</div></section><p class="data-note">Score indicatif · ${coverage[0]} pour le produit 1, ${coverage[1]} pour le produit 2.${different?' Attention : les données disponibles diffèrent ; comparez ces scores avec prudence.':''}</p>`;
}
function errorMessage(error){
 const remaining=error.retryAt?Math.max(1,Math.ceil((error.retryAt-Date.now())/1000)):0;
 return error.message+(remaining?` Vous pourrez réessayer dans ${remaining} s.`:'');
}
async function loadProduct(i,code,force=false){
 const version=++versions[i];loading[i]=true;errors[i]=null;provenance[i]=null;products[i]=api.peek(code)?.product||null;renderProduct(i);renderComparison();
 try{const result=await api.product(code,{force});if(version!==versions[i])return;products[i]=result.product;provenance[i]=result;}
 catch(error){if(version!==versions[i])return;products[i]=null;errors[i]=errorMessage(error);}
 finally{if(version===versions[i]){loading[i]=false;renderProduct(i);renderComparison();}}
}
function launch(newCodes,replace=false){codes=[...newCodes];syncURL(replace);[0,1].forEach(i=>{closeSearch(i);$(`search-${i}`).value='';loadProduct(i,codes[i]);});renderPresets();}
function select(i,p){++versions[i];codes[i]=String(p.code);products[i]=p;loading[i]=false;errors[i]=null;closeSearch(i);$(`search-${i}`).value='';syncURL();renderPresets();loadProduct(i,codes[i]);}
const searchStates=[0,1].map(()=>({version:0,items:[],active:-1,busy:false}));
function closeSearch(i){const state=searchStates[i];state.version++;state.active=-1;state.busy=false;$(`search-submit-${i}`).disabled=false;$(`search-submit-${i}`).textContent='Rechercher';$(`results-${i}`).classList.add('hidden');$(`search-${i}`).setAttribute('aria-expanded','false');$(`search-${i}`).removeAttribute('aria-activedescendant');$(`results-${i}`).removeAttribute('aria-busy');}
function openSearch(i){$(`results-${i}`).classList.remove('hidden');$(`search-${i}`).setAttribute('aria-expanded','true');}
function resultOptions(i){return searchStates[i].items.map((p,j)=>`<button class="result-option" id="option-${i}-${j}" role="option" aria-selected="false" data-item="${j}">${photo(p,true)}<span class="result-text"><span class="result-name">${esc(p.product_name||'Produit sans nom')}</span><small>${esc(p.brands||'Marque non renseignée')}</small></span>${gradeBadge(p)}</button>`).join('');}
async function search(i){
 const input=$(`search-${i}`),query=input.value.trim(),state=searchStates[i];if(state.busy)return;
 openSearch(i);state.items=[];state.active=-1;
 if(query.length<2){$(`results-${i}`).innerHTML='<div class="result-state" role="status">Saisissez un nom (2 caractères minimum) ou un code-barres.</div>';return;}
 const version=++state.version;state.busy=true;$(`search-submit-${i}`).disabled=true;$(`search-submit-${i}`).textContent='Recherche…';$(`results-${i}`).setAttribute('aria-busy','true');$(`results-${i}`).innerHTML='<div class="result-state" role="status">Recherche dans les placards…</div>';
 try{
  const result=await api.search(query);if(version!==state.version)return;
  state.items=result.products;
  const info=result.source==='fallback'?`${errorMessage(result.error)} Voici uniquement les produits déjà enregistrés.`:result.source==='cache'?`Résultats enregistrés le ${dateLabel(result.time)}.`:'';
  $(`results-${i}`).innerHTML=(info?`<div class="result-state result-info" role="status">${esc(info)}${result.source==='fallback'?'<button class="search-retry">Réessayer</button>':''}</div>`:'')+(state.items.length?resultOptions(i):'<div class="result-state" role="status">Aucun produit trouvé. Essayez une marque ou un nom plus court.</div>');
  $(`results-${i}`).querySelectorAll('[data-item]').forEach(el=>el.onclick=()=>{select(i,state.items[+el.dataset.item]);input.focus();});
  $(`results-${i}`).querySelector('.search-retry')?.addEventListener('click',()=>search(i));bindImages($(`results-${i}`));
 }catch(error){if(version!==state.version)return;$(`results-${i}`).innerHTML=`<div class="result-state" role="status">${esc(errorMessage(error))}<button class="search-retry">Réessayer</button></div>`;$(`results-${i}`).querySelector('button').onclick=()=>search(i);}
 finally{if(version===state.version){state.busy=false;$(`search-submit-${i}`).disabled=false;$(`search-submit-${i}`).textContent='Rechercher';$(`results-${i}`).removeAttribute('aria-busy');}}
}
for(const i of [0,1]){
 $(`search-submit-${i}`).onclick=()=>search(i);
 $(`search-${i}`).addEventListener('input',()=>closeSearch(i));
 $(`search-${i}`).addEventListener('keydown',e=>{
  const s=searchStates[i],options=[...$(`results-${i}`).querySelectorAll('[role="option"]')];
  if(e.key==='Escape'){closeSearch(i);return;}
  if(['ArrowDown','ArrowUp'].includes(e.key)&&!$(`results-${i}`).classList.contains('hidden')&&options.length){e.preventDefault();s.active=(s.active+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options.forEach((el,j)=>{el.classList.toggle('focused',j===s.active);el.setAttribute('aria-selected',String(j===s.active));});$(`search-${i}`).setAttribute('aria-activedescendant',options[s.active].id);options[s.active].scrollIntoView({block:'nearest'});}
  if(e.key==='Enter'){e.preventDefault();if(s.active>=0&&s.items[s.active]&&!$(`results-${i}`).classList.contains('hidden'))select(i,s.items[s.active]);else search(i);}
 });
}
document.addEventListener('click',e=>[0,1].forEach(i=>{if(!$(`search-wrap-${i}`).contains(e.target))closeSearch(i);}));
$('swap').onclick=()=>{codes.reverse();products.reverse();loading.reverse();errors.reverse();provenance.reverse();versions[0]++;versions[1]++;[0,1].forEach(i=>{closeSearch(i);if(loading[i])loadProduct(i,codes[i]);else renderProduct(i);});syncURL();renderComparison();};
$('random').onclick=()=>{const choices=presets.filter(p=>!p.codes.every(c=>codes.includes(c)));launch(choices[Math.floor(Math.random()*choices.length)].codes);};
let toastTimer;function toast(text){$('toast').textContent=text;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),3500);}
$('share').onclick=async()=>{try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(location.href);else{const el=document.createElement('textarea');el.value=location.href;el.style.position='fixed';el.style.opacity='0';document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok)throw Error();}$('share-label').textContent='Lien copié !';toast('Lien copié ! Le duel est prêt à être partagé.');setTimeout(()=>$('share-label').textContent='Partager ce duel',3000);}catch{toast('Copiez le lien depuis la barre d’adresse pour partager ce duel.');}};
initLearning();$('how').onclick=()=>$('method-dialog').showModal();$('method').onclick=()=>openLearning('score');$('close-dialog').onclick=()=>$('method-dialog').close();$('method-dialog').addEventListener('click',e=>{if(e.target===$('method-dialog')){const r=$('method-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('method-dialog').close();}});
function fromURL(){const q=new URLSearchParams(location.search);return [q.get('p1')||presets[0].codes[0],q.get('p2')||presets[0].codes[1]];}
window.addEventListener('popstate',()=>launch(fromURL(),true));
try{api.seed(await fetch('./products.json').then(r=>r.json()));}catch{}
launch(fromURL(),true);
