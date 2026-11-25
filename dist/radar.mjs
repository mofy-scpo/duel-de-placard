const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = ['Nutri-Score', 'NOVA', 'Additifs', 'Sucres', 'Gras saturés'];
const center = [280, 200], radius = 123;
export function radarPoint(axis, value, size = radius) {
  if (!Number.isFinite(value)) return null;
  const angle = -Math.PI / 2 + axis * Math.PI * 2 / 5;
  return [center[0] + Math.cos(angle) * size * Math.max(0, Math.min(100, value)) / 100, center[1] + Math.sin(angle) * size * Math.max(0, Math.min(100, value)) / 100].map(n => +n.toFixed(2));
}
export function radarSeries(values) {
  const points = Array.from({length:5}, (_, i) => radarPoint(i, values[i]));
  const complete = points.every(Boolean);
  return {points, polygon: complete ? points.map(p => p.join(',')).join(' ') : null, segments: points.flatMap((point, i) => point && points[(i+1)%5] ? [[point, points[(i+1)%5]]] : [])};
}
export function radarSVG(series) {
  const grid = [20,40,60,80,100].map(value => `<polygon class="radar-grid" points="${Array.from({length:5},(_,i)=>radarPoint(i,value).join(',')).join(' ')}"/><text class="radar-scale" x="286" y="${200-radius*value/100+4}">${value}</text>`).join('');
  const axes = labels.map((label,i) => {const p=radarPoint(i,100),l=radarPoint(i,100,174);return `<line class="radar-axis" x1="280" y1="200" x2="${p[0]}" y2="${p[1]}"/><text class="radar-label" x="${l[0]}" y="${l[1]}" text-anchor="${i===0?'middle':i<3?'start':'end'}" dominant-baseline="middle">${label}</text>`;}).join('');
  const traces = series.map((s,j) => {
    if (!s.visible) return '';
    const shape=radarSeries(s.values),cls='radar-product-'+j;
    const outline=shape.polygon?`<polygon class="radar-area ${cls}" points="${shape.polygon}"/>`:shape.segments.map(([a,b])=>`<line class="radar-stroke ${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`).join('');
    const dots=shape.points.map((p,i)=>p?`<circle class="radar-point ${cls}" cx="${p[0]}" cy="${p[1]}" r="${j===0?4:6}"><title>${escape(s.name)} · ${labels[i]} : ${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(s.values[i])}/100 sur cet axe</title></circle>`:'').join('');
    return outline+dots;
  }).join('');
  return `<svg viewBox="0 0 560 400" role="img" aria-labelledby="radar-title radar-description"><title id="radar-title">Profil comparé des cinq composantes du score</title><desc id="radar-description">Chaque axe va de 0 au centre à 100 au bord. Un profil plus étendu obtient davantage de points par critère. Les valeurs manquantes ne sont pas tracées. Le détail numérique est disponible dans le tableau sous le graphique.</desc>${grid}${axes}<text class="radar-scale" x="286" y="215">0</text>${traces}</svg>`;
}
