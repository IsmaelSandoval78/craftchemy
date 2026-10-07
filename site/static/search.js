// Buscador del sitio: el único JavaScript de cliente. Carga /data/index.json una vez
// y filtra por nombre en ambos idiomas y por id, sin distinguir acentos.
(() => {
  const cfg = window.BUSCA;
  const q = document.getElementById('q');
  const lista = document.getElementById('resultados');
  const estado = document.getElementById('estado');
  if (!cfg || !q || !lista) return;
  const otro = cfg.lang === 'es' ? 'en' : 'es';
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const escapar = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let datos = null;

  fetch('/data/index.json').then((r) => r.json()).then((d) => {
    datos = d.map((x) => ({ ...x, n1: norm(x[cfg.lang]), n2: norm(x[otro]), nid: x.id.replace(/_/g, ' ') }));
    buscar();
  });

  function puntaje(x, t) {
    if (x.n1 === t) return 0;
    if (x.n1.startsWith(t)) return 1;
    if (x.n1.split(/[\s-]+/).some((p) => p.startsWith(t))) return 2;
    if (x.n1.includes(t)) return 3;
    if (x.n2.includes(t) || x.nid.includes(t)) return 4;
    return -1;
  }

  function buscar() {
    if (!datos) return;
    const t = norm(q.value.trim());
    const url = new URL(location.href);
    if (t) url.searchParams.set('q', q.value.trim()); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    if (!t) { lista.innerHTML = ''; estado.textContent = ''; return; }
    const palabras = t.split(/\s+/);
    const res = datos
      .map((x) => ({ x, p: Math.max(...palabras.map((w) => puntaje(x, w))) , ok: palabras.every((w) => puntaje(x, w) >= 0) }))
      .filter((r) => r.ok)
      .sort((a, b) => a.p - b.p || a.x[cfg.lang].length - b.x[cfg.lang].length)
      .slice(0, 120);
    estado.textContent = res.length ? `${res.length}${res.length === 120 ? '+' : ''} ${cfg.resultados}` : `${cfg.sin} “${q.value.trim()}”`;
    lista.innerHTML = res.map(({ x }) =>
      `<li><a href="${cfg.base}/${x.id}/"><img src="/iconos/${x.id}.png" alt="" width="24" height="24" loading="lazy"><span>${escapar(x[cfg.lang])}</span></a></li>`).join('');
  }

  q.value = new URLSearchParams(location.search).get('q') || '';
  q.addEventListener('input', buscar);
  q.form.addEventListener('submit', (e) => { e.preventDefault(); buscar(); });
})();
