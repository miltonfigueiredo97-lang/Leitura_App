
// ════════════════════════════════════════════════
// CARREGA DADOS DO FIREBASE E INICIALIZA O DASHBOARD
// ════════════════════════════════════════════════
const DATA_URL = '/data.json';


function coverUrl(isbn, size='M') {
  if (!isbn) return '';
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
}

// Verifica se imagem é válida (OL retorna 1x1 para ISBNs sem capa)
function isValidCover(img) {
  // Se ainda está carregando, considera válida
  if (!img.complete) return true;
  // Imagem de 1x1 do Open Library = sem capa
  return img.naturalWidth > 5 && img.naturalHeight > 5;
}

function proxyUrl(url) {
  if (!url) return '';
  if (url.includes('openlibrary.org') || url.includes('wsrv.nl') || url.includes('weserv.nl') || url.includes('books.google')) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
}

function coverImg(isbn, fallback='📖', cls='', customUrl='') {
  const uid = 'cv_' + Math.random().toString(36).slice(2,8);
  const sources = [];
  if (customUrl) {
    sources.push(proxyUrl(customUrl)); // proxy primeiro para Amazon
    if (proxyUrl(customUrl) !== customUrl) sources.push(customUrl); // depois direto
  }
  if (isbn) {
    sources.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
    sources.push(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
  }

  const html = `<img id="${uid}" src="" class="cover-img ${cls}"
    style="width:60px;height:84px;object-fit:cover;border-radius:4px;flex-shrink:0" alt="capa">
  <span id="${uid}_fb" style="font-size:32px;display:none">${fallback}</span>`;

  setTimeout(() => {
    const el = document.getElementById(uid);
    const fb = document.getElementById(uid+'_fb');
    if (!el || !sources.length) { if(fb) fb.style.display='block'; return; }
    let idx = 0;
    function tryNext() {
      if (idx >= sources.length) {
        el.style.display='none';
        if(fb) fb.style.display='block';
        return;
      }
      const src = sources[idx++];
      el.onerror = tryNext;
      el.onload = () => {
        requestAnimationFrame(() => {
          if (el.naturalWidth < 5 && el.naturalHeight < 5) tryNext();
        });
      };
      el.src = src;
    }
    tryNext();
  }, 50);
  return html;
}

function coverThumb(isbn, customUrl='') {
  const uid = 'th_' + Math.random().toString(36).slice(2,8);
  const sources = [];
  if (customUrl) {
    sources.push(proxyUrl(customUrl));
    if (proxyUrl(customUrl) !== customUrl) sources.push(customUrl);
  }
  if (isbn) sources.push(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
  if (!sources.length) return '';

  const html = `<img id="${uid}" src="" class="cover-img"
    style="width:36px;height:50px;object-fit:cover;border-radius:4px;flex-shrink:0" alt="">`;

  setTimeout(() => {
    const el = document.getElementById(uid);
    if (!el) return;
    let idx = 0;
    function tryNext() {
      if (idx >= sources.length) { el.style.display='none'; return; }
      const src = sources[idx++];
      el.onerror = tryNext;
      el.onload = () => {
        requestAnimationFrame(() => {
          if (el.naturalWidth < 5 && el.naturalHeight < 5) tryNext();
        });
      };
      el.src = src;
    }
    tryNext();
  }, 50);
  return html;
}


const AUTOR_MAP = {
  'Palavras de Radiancia':'Brandon Sanderson','Ritmo de Guerra':'Brandon Sanderson',
  'Ventos e Verdade':'Brandon Sanderson','O Caminho dos reis':'Brandon Sanderson',
  'O Caminho dos Reis':'Brandon Sanderson','Sacramentadora':'Brandon Sanderson',
  'Warbreaker':'Brandon Sanderson','Elantris':'Brandon Sanderson',
  'A Esperança de Elantris':'Brandon Sanderson','Chama de Ferro':'Brandon Sanderson',
  'Mistborn 1º Era Livro 2':'Brandon Sanderson','Mistborn 1º Era Livro 3':'Brandon Sanderson',
  'Mistborn 2º Era Livro 1':'Brandon Sanderson','Mistborn - Historia Screta':'Brandon Sanderson',
  'Yumi e o Pintor de Pesadelos':'Brandon Sanderson','Dawnshard':'Brandon Sanderson',
  'Tress A Garota do mar Esmeralda':'Brandon Sanderson',
  'O Temor do Sabio':'Patrick Rothfuss','O nome do Vento':'Patrick Rothfuss',
  'Nevernight':'Jay Kristoff','Godsgrave':'Jay Kristoff',
  'Six of Crows':'Leigh Bardugo','Sombra e Ossos':'Leigh Bardugo',
  'Sol e Tormenta':'Leigh Bardugo','Ruina e Ascensão':'Leigh Bardugo',
  'O Aprendiz de Assassino':'Robin Hobb','A flecha de Fogo':'Robin Hobb',
  'Meio Rei':'Joe Abercrombie','A Descoberta das Bruxas':'Deborah Harkness',
  'O Principe Cruel':'Holly Black','Eu sou o numero 4':'Pittacus Lore',
  'Eu sou o Numero 4':'Pittacus Lore','O poder dos seis':'Pittacus Lore',
  'O Poder dos Seis':'Pittacus Lore','Ascenção dos Nove':'Pittacus Lore',
  'Quarta Asa':'Rebecca Yarros','Guerra da Papoula':'R.F. Kuang',
  'A Casa de Hades':'Rick Riordan','O Sangue do Olimpo':'Rick Riordan',
  'Jardins da Lua - Imperio Malazano':'Steven Erikson',
  'Carl O Explorador de Masmorras':'Adrian Collins',
  'Of Blood and Fire':'Ryan Cahill',
  'The Echoes Saga - Rise of the Ranger':'Phil Tucker',
  'Songs of Chaos - Ascendant':'Michael R. Miller',
  'The Sword of Kaigen':'M.L. Wang','Murtagh':'Christopher Paolini',
  'Harry Potter - A Pedra Filosofal':'J.K. Rowling',
  'o Feiticeiro de Terramar':'Ursula K. Le Guin',
  'O Sobrinho do Mago':'C.S. Lewis','O Leão a Feiticeira e Guarda-Roupa':'C.S. Lewis',
  'O Inimigo do Mundo':'Robert Jordan','Leruth':'Autor Independente',
  'Edgeshard':'David Estes','Cinco Laminas Partidas':'Mai Corland',
  'Rei dos Espinhos':'Mark Lawrence','Herdeiros do Tempo':'Adrian Tchaikovsky',
  'Eragon':'Christopher Paolini',
  'A Cidade de Bronze':'Deborah Harkness',
  'Daevabad Trilogy':'S.A. Chakraborty',
};


async function carregarDados() {
  try {
    const resp = await fetch(DATA_URL + '?t=' + Date.now());
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const d = await resp.json();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    inicializar(d);
  } catch(e) {
    document.getElementById('loading').innerHTML =
      '<p style="color:#f88c6a;padding:40px;text-align:center">⚠️ Erro ao carregar dados: ' + e.message + '<br><small>Verifique se o data.json está no repositório.</small></p>';
  }
}

async function _fetchEAtualizar() {
  const u = typeof usuarioAtual !== 'undefined' ? usuarioAtual : 'Milton';
  try {
    const resp = await fetch(DATA_URL + '?t=' + Date.now());
    if (!resp.ok) return false;
    const d = await resp.json();
    window._dadosD = d;
    setUsuario(u);
    return true;
  } catch(e) { return false; }
}

async function recarregarDados(delay = 3000) {
  await new Promise(r => setTimeout(r, delay));
  await _fetchEAtualizar();
}

async function recarregarAteAtualizar(referencia, verificar) {
  // Tenta até 25x com 1.5s de intervalo (até ~37s) até o JSON mudar (ou até verificar() retornar true)
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const u = typeof usuarioAtual !== 'undefined' ? usuarioAtual : 'Milton';
    try {
      const resp = await fetch(DATA_URL + '?t=' + Date.now());
      if (!resp.ok) continue;
      const d = await resp.json();
      const sessoesNow = (d.sessoes||[]).length;
      const mudou = typeof verificar === 'function'
        ? verificar(d)
        : (sessoesNow !== referencia);
      if (mudou || i === 24) {
        window._dadosD = d;
        setUsuario(u);
        const btn = document.getElementById('btn-refresh');
        if (btn) { btn.textContent = '✅'; setTimeout(() => btn.textContent = '🔄', 1500); }
        break;
      }
    } catch(e) {}
  }
}
async function manualRefresh() {
  const btn = document.getElementById('btn-refresh');
  if (btn) btn.textContent = '⏳';
  const u = typeof usuarioAtual !== 'undefined' ? usuarioAtual : 'Milton';
  try {
    const resp = await fetch(DATA_URL + '?t=' + Date.now());
    if (resp.ok) {
      const d = await resp.json();
      window._dadosD = d;
      setUsuario(u);
      if (btn) { btn.textContent = '✅'; setTimeout(() => btn.textContent = '🔄', 1500); }
    }
  } catch(e) {
    if (btn) { btn.textContent = '❌'; setTimeout(() => btn.textContent = '🔄', 1500); }
  }
}
window.manualRefresh = manualRefresh;
window.recarregarDados = recarregarDados;
window.recarregarAteAtualizar = recarregarAteAtualizar;

async function carregarDados() {
  try {
    const resp = await fetch(DATA_URL + '?t=' + Date.now());
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const d = await resp.json();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    inicializar(d);
  } catch(e) {
    document.getElementById('loading').innerHTML =
      '<p style="color:#f88c6a;padding:40px;text-align:center">⚠️ Erro ao carregar dados: ' + e.message + '<br><small>Verifique se o data.json está no repositório.</small></p>';
  }
}

function inicializar(d) {
  window._dadosD = d;
  // Carga inicial = Milton
  const sessoesF = (d.sessoes||[]).filter(s => !s.usuario || s.usuario === '' || s.usuario.toUpperCase() === 'MILTON');
  const livroMap = new Map();
  [...(d.livros||[]), ...(d.lendo||[]), ...(d.pausados||[]), ...(d.aguardando||[])]
    .filter(l => l.livro && l.livro.length > 1)
    .filter(l => !l.usuario || l.usuario === '' || l.usuario.toUpperCase() === 'MILTON')
    .forEach(l => { if (!livroMap.has(l.livro)) livroMap.set(l.livro, l); });
  window._livros  = [...livroMap.values()];
  window._sessoes = sessoesF;
  recalcularDados(d, sessoesF);
}

function recalcularDados(d, sessoes) {

  // ── MONTHLY ─────────────────────────────────────────
  const byMonth = {};
  sessoes.forEach(s => {
    if (!s.data) return;
    const ym = s.data.slice(0,7); // "2024-03"
    const [y, m] = ym.split('-');
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const label = meses[parseInt(m)-1] + '/' + y.slice(2);
    byMonth[ym] = { label, v: (byMonth[ym]?.v || 0) + s.paginas };
  });
  const MONTHLY = Object.keys(byMonth).sort().map(k => ({ m: byMonth[k].label, v: byMonth[k].v }));

  // ── YEARS ───────────────────────────────────────────
  const byYear = {};
  const byYearDay = {};
  sessoes.forEach(s => {
    const yr = s.ano || parseInt((s.data||'').slice(0,4));
    if (!yr) return;
    if (!byYear[yr]) byYear[yr] = { pag:0, sess:0, min:0, days:{} };
    byYear[yr].pag  += s.paginas;
    byYear[yr].sess += 1;
    byYear[yr].min  += s.minutos || 0;
    if (s.data) byYear[yr].days[s.data] = (byYear[yr].days[s.data]||0) + s.paginas;
  });
  const YEARS = Object.keys(byYear).sort().map(yr => {
    const y = byYear[yr];
    const dias = Object.values(y.days);
    const pgdia = dias.length ? Math.round(dias.reduce((a,b)=>a+b,0)/dias.length*10)/10 : 0;
    const ppm = y.min>0 ? Math.round(y.pag/y.min*100)/100 : 0;
    return { ano: parseInt(yr), pag: y.pag, sess: y.sess, pgdia, ppm, horas: Math.round(y.min/60) };
  });

  // ── WEEKDAY ─────────────────────────────────────────
  const wdNames = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  function calcWd(filtroAno) {
    const src = filtroAno ? sessoes.filter(s => s.ano === filtroAno) : sessoes;
    const soma = [0,0,0,0,0,0,0], cnt = [0,0,0,0,0,0,0], total = [0,0,0,0,0,0,0];
    src.forEach(s => {
      if (!s.data) return;
      const wd = (new Date(s.data + 'T12:00:00').getDay() + 6) % 7; // 0=Seg
      soma[wd] += s.paginas; cnt[wd]++; total[wd] += s.paginas;
    });
    return {
      avg: soma.map((v,i) => cnt[i] ? Math.round(v/cnt[i]*10)/10 : 0),
      sum: total
    };
  }
  const WD_ALL  = calcWd(null);
  const WD_2024 = calcWd(2024);
  const WD_2025 = calcWd(2025);
  const WD_2026 = calcWd(2026);
  const WD_AVG = { 'total': WD_ALL.avg, '2024': WD_2024.avg, '2025': WD_2025.avg, '2026': WD_2026.avg };
  const WD_SUM = { 'total': WD_ALL.sum, '2024': WD_2024.sum, '2025': WD_2025.sum, '2026': WD_2026.sum };

  // ── NOTES ────────────────────────────────────────────
  // Enrich notas with real year from sessoes (ano field in NOTAS sheet is nota geral, not year)
  const bookFinishYear = {};
  sessoes.forEach(s => {
    if (s.ano > 2000) bookFinishYear[s.livro] = Math.max(bookFinishYear[s.livro]||0, s.ano);
  });
  const u = (typeof usuarioAtual !== 'undefined' ? usuarioAtual : 'Milton');
  const notasFiltradas = (d.notas || []).filter(n =>
    u === 'Milton'
      ? (!n.usuario || n.usuario === '' || n.usuario.toUpperCase() === 'MILTON')
      : n.usuario?.toUpperCase() === u.toUpperCase()
  );
  const NOTES = notasFiltradas.map(n => ({
    ...n,
    ano: bookFinishYear[n.livro] || (n.ano > 2000 ? n.ano : 0)
  })).sort((a,b) => b.media - a.media);
  window.NOTES = NOTES;

  // ── COLECOES ─────────────────────────────────────────
  const byCol = {};
  sessoes.forEach(s => {
    const c = s.colecao || 'Outros';
    byCol[c] = (byCol[c] || 0) + s.paginas;
  });
  const colSort = Object.entries(byCol).sort((a,b) => b[1]-a[1]);
  const top9 = colSort.slice(0,9);
  const outros = colSort.slice(9).reduce((s,[,v]) => s+v, 0);
  const COLECOES = [...top9.map(([c,p]) => ({c,p})), ...(outros>0 ? [{c:'Outros',p:outros}] : [])];

  // ── BOOK DAILY ───────────────────────────────────────
  const BOOK_DAILY = {};
  sessoes.forEach(s => {
    if (!s.livro || !s.data || !s.paginas) return;
    // Normaliza data para yyyy-MM-dd
    let dataKey = s.data;
    if (dataKey.includes('/')) {
      const [d,m,y] = dataKey.split('/');
      dataKey = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
    if (!BOOK_DAILY[s.livro]) BOOK_DAILY[s.livro] = [];
    const existing = BOOK_DAILY[s.livro].find(r => r.d === dataKey);
    if (existing) existing.p += s.paginas;
    else BOOK_DAILY[s.livro].push({ d: dataKey, p: s.paginas });
  });
  Object.keys(BOOK_DAILY).forEach(k => BOOK_DAILY[k].sort((a,b) => a.d.localeCompare(b.d)));

  // Reconstrói as estruturas que os gráficos precisam a partir dos dados filtrados

  // Popular seletor de ano Visão Geral
  const selVGAno = document.getElementById('selVGAno');
  if (selVGAno) {
    const anoAtualSel = selVGAno.value;
    selVGAno.innerHTML = '<option value="total">Todos os anos</option>';
    const anosVG = [...new Set(sessoes.map(s=>s.ano).filter(a=>a>2000))].sort();
    anosVG.forEach(a => selVGAno.innerHTML += `<option value="${a}">${a}</option>`);
    if (anoAtualSel) selVGAno.value = anoAtualSel;
  }

  // Agora chama com dados disponíveis
  atualizarVisaoGeral();

  // mediaParDia para cálculo de dias estimados nos cards de lendo
  const dayMapTemp = {};
  sessoes.forEach(s => { if(s.data) dayMapTemp[s.data]=(dayMapTemp[s.data]||0)+s.paginas; });
  const diasValsTemp = Object.values(dayMapTemp);
  const mediaParDia = diasValsTemp.length ? Math.round(diasValsTemp.reduce((a,b)=>a+b,0)/diasValsTemp.length*10)/10 : 50;

  // Maior e menor livro — sem filtro de ano aqui (atualizarVisaoGeral faz o filtro)
  const livrosLidos = (window._livros||[]).filter(l => l.status === 'Completo' && l.totalPag > 0);
  if (livrosLidos.length) {
    const sorted = [...livrosLidos].sort((a,b) => b.totalPag - a.totalPag);
    const maior = sorted[0], menor = sorted[sorted.length-1];
    document.getElementById('kpi-maior-val').textContent   = maior.totalPag.toLocaleString('pt-BR');
    document.getElementById('kpi-maior-nome').textContent  = maior.livro;
    document.getElementById('kpi-maior-autor').textContent = maior.autor || AUTOR_MAP[maior.livro] || '';
    document.getElementById('capa-maior').innerHTML        = coverImg(maior.isbn, '📖', '', maior.coverUrl||'');
    document.getElementById('kpi-menor-val').textContent   = menor.totalPag.toLocaleString('pt-BR');
    document.getElementById('kpi-menor-nome').textContent  = menor.livro;
    document.getElementById('kpi-menor-autor').textContent = menor.autor || AUTOR_MAP[menor.livro] || '';
    document.getElementById('capa-menor').innerHTML        = coverImg(menor.isbn, '📕', '', menor.coverUrl||'');
  } else {
    ['kpi-maior-val','kpi-maior-nome','kpi-maior-autor','kpi-menor-val','kpi-menor-nome','kpi-menor-autor']
      .forEach(id => { const e2 = document.getElementById(id); if(e2) e2.textContent = '—'; });
    ['capa-maior','capa-menor'].forEach(id => { const e2 = document.getElementById(id); if(e2) e2.innerHTML = ''; });
  }

  // Melhor e pior avaliado — filtra por ano
  const notasDoAno = window.NOTES || [];
  if (notasDoAno.length) {
    const ns = [...notasDoAno].sort((a,b) => b.media - a.media);
    const melhor = ns[0], pior = ns[ns.length-1];
    const allLivrosVG = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
    const melhorL = allLivrosVG.find(l => l.livro === melhor.livro);
    const piorL   = allLivrosVG.find(l => l.livro === pior.livro);
    document.getElementById('kpi-melhor-val').textContent   = melhor.media.toFixed(1);
    document.getElementById('kpi-melhor-nome').textContent  = melhor.livro;
    document.getElementById('kpi-melhor-autor').textContent = melhorL?.autor || AUTOR_MAP[melhor.livro] || '';
    document.getElementById('capa-melhor').innerHTML        = coverImg(melhorL?.isbn, '⭐', '', melhorL?.coverUrl||'');
    document.getElementById('kpi-pior-val').textContent     = pior.media.toFixed(1);
    document.getElementById('kpi-pior-nome').textContent    = pior.livro;
    document.getElementById('kpi-pior-autor').textContent   = piorL?.autor || AUTOR_MAP[pior.livro] || '';
    document.getElementById('capa-pior').innerHTML          = coverImg(piorL?.isbn, '💀', '', piorL?.coverUrl||'');
  } else {
    ['kpi-melhor-val','kpi-melhor-nome','kpi-melhor-autor','kpi-pior-val','kpi-pior-nome','kpi-pior-autor']
      .forEach(id => { const e2 = document.getElementById(id); if(e2) e2.textContent = '—'; });
    ['capa-melhor','capa-pior'].forEach(id => { const e2 = document.getElementById(id); if(e2) e2.innerHTML = ''; });
  }

  // Recalcula metasPorAno a partir dos livros e sessões já filtrados por usuário
  const metasPorAno = {};
  (window._livros||[]).forEach(l => {
    if (!l.metaAno || l.metaAno === 'AINDA NÃO DEFINIDO') return;
    const ano = String(l.metaAno);
    if (!metasPorAno[ano]) metasPorAno[ano] = {
      total:0, lidos:0, lendo:0, pausados:0, aguardando:0,
      paginasTotal:0, paginasLidas:0, paginasFaltando:0,
      mediaDiaria:0, ritmoAtual:0, dataPrevistoAtual:'—'
    };
    const m = metasPorAno[ano];
    m.total++;
    m.paginasTotal += l.totalPag || 0;
    if (l.status === 'Completo')   { m.lidos++; m.paginasLidas += l.totalPag || 0; }
    if (l.status === 'Lendo')        m.lendo++;
    if (l.status === 'Pausado')      m.pausados++;
    if (l.status === 'Aguardando')   m.aguardando++;
  });
  // Adiciona páginas lidas via sessões para livros em andamento
  sessoes.forEach(s => {
    if (!s.data) return;
    const ano = String(s.ano || s.data.slice(0,4));
    if (!metasPorAno[ano]) return;
    // Livro da sessão está na meta do ano?
    const livroMeta = (window._livros||[]).find(l => l.livro === s.livro && l.metaAno === ano && l.status !== 'Completo');
    if (livroMeta) metasPorAno[ano].paginasLidas += s.paginas;
  });
  Object.keys(metasPorAno).forEach(ano => {
    const m = metasPorAno[ano];
    m.paginasFaltando = Math.max(0, m.paginasTotal - m.paginasLidas);
    const sessAno = sessoes.filter(s => String(s.ano) === ano || s.data?.startsWith(ano));
    const diasAnos = new Set(sessAno.map(s=>s.data)).size;
    const pagAnos  = sessAno.reduce((a,s)=>a+s.paginas,0);
    m.mediaDiaria = diasAnos > 0 ? Math.round(pagAnos/diasAnos*10)/10 : 0;
    const hoje = new Date();
    const trintaDias = new Date(hoje.getTime()-30*86400000);
    const recentes = sessAno.filter(s => new Date(s.data+'T12:00:00') >= trintaDias);
    const diasRec = new Set(recentes.map(s=>s.data)).size;
    const pagRec  = recentes.reduce((a,s)=>a+s.paginas,0);
    m.ritmoAtual = diasRec > 0 ? Math.round(pagRec/diasRec*10)/10 : 0;
    if (m.paginasFaltando > 0 && m.ritmoAtual > 0) {
      const dias = Math.ceil(m.paginasFaltando / m.ritmoAtual);
      const prev = new Date(hoje.getTime() + dias*86400000);
      m.dataPrevistoAtual = prev.toLocaleDateString('pt-BR');
    } else {
      m.dataPrevistoAtual = m.lidos >= m.total ? 'Concluída!' : '—';
    }
  });

  const anosMetaDisp = Object.keys(metasPorAno).sort();
  const selMetaAno = document.getElementById('selMetaAno');
  selMetaAno.innerHTML = '';
  const anosParaSel = anosMetaDisp.length ? anosMetaDisp : ['2026'];
  anosParaSel.forEach(a => {
    selMetaAno.innerHTML += `<option value="${a}" ${a==='2026'?'selected':''}>${a}</option>`;
  });
  window._metasPorAno = metasPorAno;
  buildMeta();
  renderLendoCards();

  // Atualiza rodapé com data de geração
  if (d.geradoEm) {
    const dt = new Date(d.geradoEm);
    document.getElementById('footer-data').textContent = dt.toLocaleString('pt-BR');
  }

  // Passa os dados calculados para os gráficos e re-renderiza tudo
  renderizarGraficos({ MONTHLY, YEARS, WD_AVG, WD_SUM, NOTES, COLECOES, BOOK_DAILY });
  atualizarVisaoGeral();
  renderLendoCards();
  buildMeta();
  document.getElementById('header-badge').textContent =
    `${(window._livros||[]).length} livros · ${(window._sessoes||[]).length} sessões`;
}
// Variáveis globais dos gráficos
let MONTHLY, YEARS, WD_AVG, WD_SUM, NOTES, COLECOES, BOOK_DAILY;
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelected = null;

const TT = {
  backgroundColor:'#1e2535',
  borderColor:'#2a3248',
  borderWidth:1,
  titleColor:'#e2e8f0',
  bodyColor:'#8892a8',
  padding:10
};
const GRID_COLOR = 'rgba(42,50,72,0.6)';
const TICK_COLOR = '#8892a8';

function baseScales(xRot) {
  return {
    x: { ticks:{ color:TICK_COLOR, font:{size:10}, maxRotation: xRot||0 }, grid:{ color:GRID_COLOR } },
    y: { ticks:{ color:TICK_COLOR }, grid:{ color:GRID_COLOR }, beginAtZero:true }
  };
}

const YC = ['#8b7cf8','#f88c6a','#4ecdc4','#ffd166'];
const WD_LABELS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const WD_COLORS = ['#8b7cf8','#8b7cf8','#8b7cf8','#8b7cf8','#8b7cf8','#f88c6a','#ffd166'];
const DONUT_COLORS = ['#8b7cf8','#f88c6a','#4ecdc4','#ffd166','#e56cff','#56cfff','#ff6b9d','#a8e063','#f9c74f','#90e0ef'];

function atualizarVisaoGeral() {
  const d = window._dadosD;
  if (!d) return;
  const ano = document.getElementById('selVGAno')?.value || 'total';
  window._anoVG = ano;
  const sessAll = window._sessoes || [];
  const sessoes = ano === 'total' ? sessAll : sessAll.filter(s => String(s.ano) === String(ano));

  const totalPagsVG = sessoes.reduce((s,r) => s+r.paginas, 0);
  const dayMapVG = {}, dayLivroVG = {};
  sessoes.forEach(s => {
    if (s.data) {
      dayMapVG[s.data] = (dayMapVG[s.data]||0) + s.paginas;
      if (!dayLivroVG[s.data]) dayLivroVG[s.data] = s.livro;
    }
  });
  const diasValsVG = Object.values(dayMapVG);
  const mediaParDiaVG = diasValsVG.length ? Math.round(diasValsVG.reduce((a,b)=>a+b,0)/diasValsVG.length*10)/10 : 0;
  const recordeVG = diasValsVG.length ? Math.max(...diasValsVG) : 0;
  const recordeDataVG = Object.entries(dayMapVG).find(([,v])=>v===recordeVG)?.[0] || '';
  const recordeLabelVG = recordeDataVG
    ? new Date(recordeDataVG+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})
    : 'páginas em um dia';
  const recordeLivroVG = dayLivroVG[recordeDataVG] || '';
  const recordeLivroDataVG = (window._livros||[]).find(l=>l.livro===recordeLivroVG);
  const horasTotaisVG = Math.round(sessoes.reduce((s,r)=>s+(r.minutos||0),0)/60);

  const el = id => document.getElementById(id);
  const livrosU = (window._livros||[]);

  // Mapa livro -> ano última sessão
  const ultimaAnoMap = {};
  sessAll.forEach(s => {
    const a = s.data?.slice(0,4)||'';
    if (a && (!ultimaAnoMap[s.livro] || a > ultimaAnoMap[s.livro])) ultimaAnoMap[s.livro] = a;
  });

  const livrosNoAno = ano === 'total' ? livrosU : livrosU.filter(l => {
    const anoRef = (l.anoConclusao && l.anoConclusao.length === 4)
      ? l.anoConclusao
      : (l.metaAno && String(l.metaAno).length === 4)
        ? String(l.metaAno)
        : (ultimaAnoMap[l.livro] || '');
    return anoRef === String(ano);
  });

  el('kpi-paginas').textContent    = totalPagsVG.toLocaleString('pt-BR');
  el('kpi-livros').textContent     = livrosNoAno.filter(l=>l.status==='Completo').length;
  el('kpi-lendo').textContent      = livrosNoAno.filter(l=>l.status==='Lendo').length;
  el('kpi-pausados').textContent   = livrosNoAno.filter(l=>l.status==='Pausado').length;
  el('kpi-aguardando').textContent = livrosNoAno.filter(l=>l.status==='Aguardando').length;
  el('kpi-todos').textContent      = livrosNoAno.length;
  el('kpi-sessoes').textContent    = sessoes.length.toLocaleString('pt-BR');
  el('kpi-pgdia').textContent      = mediaParDiaVG.toFixed(1).replace('.',',');
  el('kpi-horas').textContent      = horasTotaisVG + 'h';
  el('kpi-recorde').textContent    = recordeVG;
  el('kpi-recorde-data').textContent = recordeLabelVG;
  el('kpi-recorde-livro').textContent = recordeLivroVG;
  el('kpi-recorde-autor').textContent = recordeLivroDataVG?.autor || '';

  // Maior e menor livro — usa metaAno apenas (ano de conclusão)
  const livrosLidosVG = (window._livros||[]).filter(l =>
    l.status === 'Completo' && l.totalPag > 0 &&
    (ano === 'total' || String(l.metaAno) === String(ano))
  );
  if (livrosLidosVG.length) {
    const sorted = [...livrosLidosVG].sort((a,b) => b.totalPag - a.totalPag);
    const maior = sorted[0], menor = sorted[sorted.length-1];
    el('kpi-maior-val').textContent   = maior.totalPag.toLocaleString('pt-BR');
    el('kpi-maior-nome').textContent  = maior.livro;
    el('kpi-maior-autor').textContent = maior.autor || '';
    const cMaior = document.getElementById('capa-maior'); if(cMaior) cMaior.innerHTML = coverImg(maior.isbn,'📖','',maior.coverUrl||'');
    el('kpi-menor-val').textContent   = menor.totalPag.toLocaleString('pt-BR');
    el('kpi-menor-nome').textContent  = menor.livro;
    el('kpi-menor-autor').textContent = menor.autor || '';
    const cMenor = document.getElementById('capa-menor'); if(cMenor) cMenor.innerHTML = coverImg(menor.isbn,'📕','',menor.coverUrl||'');
  }

  // Melhor e pior avaliado — filtrado por ano
  const notasVG = (window.NOTES||[]).filter(n =>
    ano === 'total' || String(n.ano) === String(ano)
  );
  if (notasVG.length) {
    const ns = [...notasVG].sort((a,b) => b.media - a.media);
    const melhor = ns[0], pior = ns[ns.length-1];
    const allL = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
    const mL = allL.find(l=>l.livro===melhor.livro), pL = allL.find(l=>l.livro===pior.livro);
    el('kpi-melhor-val').textContent   = melhor.media.toFixed(1);
    el('kpi-melhor-nome').textContent  = melhor.livro;
    el('kpi-melhor-autor').textContent = mL?.autor || '';
    const cMelhor = document.getElementById('capa-melhor'); if(cMelhor) cMelhor.innerHTML = coverImg(mL?.isbn,'⭐','',mL?.coverUrl||'');
    el('kpi-pior-val').textContent     = pior.media.toFixed(1);
    el('kpi-pior-nome').textContent    = pior.livro;
    el('kpi-pior-autor').textContent   = pL?.autor || '';
    const cPior = document.getElementById('capa-pior'); if(cPior) cPior.innerHTML = coverImg(pL?.isbn,'💀','',pL?.coverUrl||'');
  }
}
window.atualizarVisaoGeral = atualizarVisaoGeral;

function renderLendoCards() {
  const d = window._dadosD;
  if (!d) return;
  const u = usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual;

  // Filtra lendo/pausados/aguardando pelo usuário atual
  const filterU = l => u === 'Milton'
    ? (!l.usuario || l.usuario === '' || l.usuario.toUpperCase() === 'MILTON')
    : l.usuario?.toUpperCase() === u.toUpperCase();

  const lendoU   = (d.lendo   ||[]).filter(filterU).filter(l => l.livro && l.livro.length > 2);
  const pausadosU = (d.pausados||[]).filter(filterU).filter(l => l.livro && l.livro.length > 2);
  const aguardandoU = (d.aguardando||[]).filter(filterU);
  const lendoAtual = [...lendoU, ...pausadosU];

  // Calcula mediaParDia do usuário atual
  const sessU = (window._sessoes||[]);
  const diasMap = {};
  sessU.forEach(s => { if(s.data) diasMap[s.data]=(diasMap[s.data]||0)+s.paginas; });
  const diasVals = Object.values(diasMap);
  const mediaParDia = diasVals.length ? diasVals.reduce((a,b)=>a+b,0)/diasVals.length : 50;

  const agContainer = document.getElementById('lendo-cards');
  agContainer.innerHTML = '';

  if (lendoAtual.length === 0) {
    agContainer.innerHTML = '<div class="lendo-card dica"><div class="lendo-tag">📖 Nenhum livro em andamento</div></div>';
  } else {
    lendoAtual.forEach(p => {
      const isLendo = lendoU.includes(p);
      const tag = isLendo ? '📖 Lendo' : '⏸️ Pausado';
      const cor = isLendo ? 'var(--teal)' : 'var(--orange)';
      const classe = isLendo ? 'lendo' : 'pausado';
      const faltam = p.totalPag - p.pagAtual;
      const diasRest = Math.ceil(faltam / (mediaParDia||66.8));
      const pctVal = Math.round((p.pct||0)*100*10)/10;
      const capLendo = coverImg(p.isbn, isLendo ? '📖' : '⏸️', '', p.coverUrl||'');
      agContainer.innerHTML += `
        <div class="lendo-card ${classe}">
          <div class="lendo-tag">${tag}</div>
          <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:10px;">
            <div style="flex-shrink:0">${capLendo}</div>
            <div style="flex:1;min-width:0">
              <div class="lendo-book-title" style="margin-bottom:0">${p.livro}</div>
              <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">${p.autor||''}</div>
              <div class="lendo-stats">
                <div class="lendo-stat"><span class="lendo-stat-val" style="color:${cor}">${p.pagAtual}</span><span class="lendo-stat-lbl">Página atual</span></div>
                <div class="lendo-stat"><span class="lendo-stat-val">${p.totalPag}</span><span class="lendo-stat-lbl">Total de páginas</span></div>
                <div class="lendo-stat"><span class="lendo-stat-val" style="color:var(--yellow)">~${diasRest}</span><span class="lendo-stat-lbl">Dias para acabar</span></div>
              </div>
            </div>
          </div>
          <div class="lendo-progress-wrap">
            <div class="lendo-bar-bg"><div class="lendo-bar-fg" style="width:${Math.min(pctVal,100)}%;background:${cor}"></div></div>
            <span class="lendo-pct-label" style="color:${cor}">${pctVal}%</span>
          </div>
          <div class="lendo-meta" style="display:flex;align-items:center;justify-content:space-between;">
            <span>Faltam: <b>${faltam.toLocaleString('pt-BR')} páginas</b></span>
            <button onclick="abrirSessaoRapida('${p.livro.replace(/'/g,"\\'")}')"
              style="background:var(--purple);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">
              + Registrar sessão
            </button>
          </div>
        </div>`;
    });
  }

  // Dica de leitura
  const anoAtual = new Date().getFullYear().toString();
  // Livros completos DO usuário atual
  const livrosLidos = new Set(
    (window._livros||[]).filter(l => l.status === 'Completo').map(l => l.livro.trim().toLowerCase())
  );
  const ag = aguardandoU.filter(l => {
    if (l.metaAno && parseInt(l.metaAno) > parseInt(anoAtual)) return false;
    if (l.depende && l.depende.trim()) {
      // Dependência deve estar concluída pelo usuário atual
      if (!livrosLidos.has(l.depende.trim().toLowerCase())) return false;
    }
    return true;
  });
  if (ag.length > 0) {
    const dica = ag[Math.floor(Math.random()*ag.length)];
    const diasDica = Math.ceil((dica.totalPag||200)/(mediaParDia||66.8));
    const capDica = coverImg(dica.isbn, '💡', '', dica.coverUrl||'');
    agContainer.innerHTML += `
      <div class="lendo-card dica">
        <div class="lendo-tag">💡 Dica de Leitura</div>
        <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:10px;">
          <div style="flex-shrink:0">${capDica}</div>
          <div style="flex:1;min-width:0">
            <div class="lendo-book-title" style="margin-bottom:0">${dica.livro}</div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">${dica.autor||''}</div>
            <div class="lendo-stats">
              <div class="lendo-stat"><span class="lendo-stat-val" style="color:var(--teal)">${dica.totalPag}</span><span class="lendo-stat-lbl">Total de páginas</span></div>
              <div class="lendo-stat"><span class="lendo-stat-val" style="color:var(--yellow)">~${diasDica}</span><span class="lendo-stat-lbl">Dias para ler</span></div>
            </div>
          </div>
        </div>
        <div class="lendo-progress-wrap">
          <div class="lendo-bar-bg"><div class="lendo-bar-fg" style="width:0%;background:var(--teal)"></div></div>
          <span class="lendo-pct-label teal">Não iniciado</span>
        </div>
      </div>`;
  }
}
window.renderLendoCards = renderLendoCards;

function abrirSessaoRapida(livroNome) {
  abrirModal('sessao');
  setTimeout(() => {
    // Preencher o livro automaticamente
    const inputBusca = document.getElementById('s-livro-busca');
    const inputHidden = document.getElementById('s-livro');
    const display = document.getElementById('s-livro-selecionado');
    if (inputHidden) inputHidden.value = livroNome;
    if (inputBusca) inputBusca.value = '';
    if (display) { display.textContent = '📖 ' + livroNome + ' ✕'; display.style.display = 'block'; }
    // Iniciar scroll na página atual do livro
    const livro = (window._livros||[]).find(l => l.livro === livroNome);
    if (livro && window.iniciarScrollPagina) {
      iniciarScrollPagina(livro.pagAtual||0, livro.totalPag||0);
    }
    // Esconder o campo de busca
    const buscaWrap = inputBusca?.closest('.pwa-field');
    if (buscaWrap) buscaWrap.style.display = 'none';
  }, 150);
}
window.abrirSessaoRapida = abrirSessaoRapida;

function renderizarGraficos(dados) {
  MONTHLY   = dados.MONTHLY;
  YEARS     = dados.YEARS;
  WD_AVG    = dados.WD_AVG;
  WD_SUM    = dados.WD_SUM;
  NOTES     = dados.NOTES;
  window.NOTES = NOTES;
  COLECOES  = dados.COLECOES;
  BOOK_DAILY = dados.BOOK_DAILY;
  // Destroi todos os charts existentes antes de recriar
  ['cMonthly','cDonut','cAutores','cBook'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { const ch = Chart.getChart(el); if (ch) ch.destroy(); }
  });
  inicializarGraficos();
  buildYearBars();
  buildRanking();
  buildDonuts();
  buildWd();
  buildLivrosMes();
  buildGeneros();
  buildStreaks();
  buildHeatmap();
  buildCalendar();
  if (isMobile()) setTimeout(applyMobileLayout, 400);
  setTimeout(() => ddSetModo('mes'), 300);
}

// ════════════════════════════════════════════════
// 3. RANKING
// ════════════════════════════════════════════════

let rankMode = 'best';

function updateBtns() {
  document.getElementById('btnBest').className = 'btn' + (rankMode==='best'?' on':'');
  document.getElementById('btnWorst').className = 'btn' + (rankMode==='worst'?' on':'');
}

function buildRanking() {
  const yr  = document.getElementById('selNotasAno').value;
  const tema = document.getElementById('selNotasTema')?.value || 'all';
  const col  = document.getElementById('selNotasColecao')?.value || 'all';

  const allLivros = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];

  let pool = yr === 'all' ? NOTES : NOTES.filter(b => String(b.ano) === yr);

  // Filtro por coleção
  if (col !== 'all') {
    pool = pool.filter(b => {
      const l = allLivros.find(x => x.livro === b.livro);
      return l?.colecao === col;
    });
  }

  // Calcula score pelo tema selecionado
  const scored = pool.map(b => {
    let score;
    if (tema === 'all') {
      score = b.media;
    } else {
      // criterios é objeto {Diálogos: 8, Enredo: 9, ...}
      const val = b.criterios?.[tema];
      score = val != null ? val : b.media;
    }
    return { ...b, score };
  }).filter(b => b.score != null);

  const sorted = [...scored].sort((a,b) => rankMode==='best' ? b.score-a.score : a.score-b.score);
  const top    = sorted.slice(0, 15);
  const maxA   = top[0]?.score || 10;
  const medals = ['🥇','🥈','🥉'];
  const el     = document.getElementById('rankList');
  el.innerHTML = '';
  top.forEach((b, i) => {
    const pct = Math.round(b.score/maxA*100);
    const col = rankMode==='best' ? (i<3?['#ffd166','#c0c0c0','#cd7f32'][i]:'#8b7cf8') : '#f88c6a';
    const scoreLabel = tema === 'all' ? b.score.toFixed(1) : `${b.score.toFixed(1)} <span style="font-size:10px;opacity:0.7">(${b.media.toFixed(1)} geral)</span>`;
    const rankLivro = allLivros.find(l => l.livro === b.livro);
    const rankIsbn  = rankLivro?.isbn || '';
    const capaHtml  = coverThumb(rankIsbn, rankLivro?.coverUrl||'');
    el.innerHTML += `
      <div class="rank-item" onclick="abrirLivroDetalhes('${b.livro}')" style="cursor:pointer;">
        ${capaHtml}
        <span class="rank-num">${i<3?'':('#'+(i+1))}</span>
        <span class="rank-medal">${medals[i]||''}</span>
        <div style="flex:1;min-width:0">
          <div class="rank-name" data-tip="${b.livro}">${b.livro}</div>
          <span class="rank-year">${b.ano}</span>
        </div>
        <div class="rank-bar-wrap"><div class="rank-bar"><div class="rank-bar-fill" style="width:${pct}%;background:${col}"></div></div></div>
        <span class="rank-score" style="color:${col}">${scoreLabel}</span>
      </div>`;
  });
}
// ════════════════════════════════════════════════
// 3b. RANKING COMPLETO (modal desktop)
// ════════════════════════════════════════════════
let rankModeRC = 'best';

function updateBtnsRC() {
  document.getElementById('rcBtnBest').className = 'btn' + (rankModeRC==='best'?' on':'');
  document.getElementById('rcBtnWorst').className = 'btn' + (rankModeRC==='worst'?' on':'');
}

function abrirRankingCompleto() {
  const modal = document.getElementById('modal-ranking-completo');
  // Popula filtros se ainda não foram populados
  const rcAno = document.getElementById('rcAno');
  if (rcAno.options.length <= 1) {
    const notes = window.NOTES || [];
    const anos = [...new Set(notes.map(n => n.ano).filter(a => a > 2000))].sort();
    rcAno.innerHTML = '<option value="all">Todos os anos</option>';
    anos.forEach(a => { rcAno.innerHTML += `<option value="${a}">${a}</option>`; });
    const rcCol = document.getElementById('rcColecao');
    rcCol.innerHTML = '<option value="all">Todas as coleções</option>';
    const cols = [...new Set((window._livros||[]).map(l=>l.colecao).filter(Boolean))].sort();
    cols.forEach(c => { rcCol.innerHTML += `<option value="${c}">${c}</option>`; });
  }
  // Sincroniza filtros com o ranking principal
  document.getElementById('rcAno').value = document.getElementById('selNotasAno').value;
  document.getElementById('rcColecao').value = document.getElementById('selNotasColecao')?.value || 'all';
  document.getElementById('rcTema').value = document.getElementById('selNotasTema')?.value || 'all';
  rankModeRC = rankMode;
  updateBtnsRC();
  buildRankingCompleto();
  modal.style.display = 'flex';
}

function buildRankingCompleto() {
  const yr   = document.getElementById('rcAno').value;
  const col  = document.getElementById('rcColecao').value;
  const tema = document.getElementById('rcTema').value;
  const allLivros = [...(window._livros||[])];

  let pool = yr === 'all' ? NOTES : NOTES.filter(b => String(b.ano) === yr);
  if (col !== 'all') pool = pool.filter(b => { const l = allLivros.find(x => x.livro === b.livro); return l?.colecao === col; });

  const scored = pool.map(b => {
    const score = tema === 'all' ? b.media : (b.criterios?.[tema] ?? b.media);
    return { ...b, score };
  }).filter(b => b.score != null);

  const sorted = [...scored].sort((a,b) => rankModeRC==='best' ? b.score-a.score : a.score-b.score);
  const maxA   = sorted[0]?.score || 10;
  const medals = ['🥇','🥈','🥉'];
  const el     = document.getElementById('rcList');
  document.getElementById('rcTotal').textContent = `${sorted.length} livro${sorted.length!==1?'s':''} no ranking`;
  el.innerHTML = '';
  sorted.forEach((b, i) => {
    const pct = Math.round(b.score/maxA*100);
    const cor = rankModeRC==='best' ? (i<3?['#ffd166','#c0c0c0','#cd7f32'][i]:'#8b7cf8') : '#f88c6a';
    const scoreLabel = tema === 'all' ? b.score.toFixed(1) : `${b.score.toFixed(1)} <span style="font-size:10px;opacity:0.7">(${b.media.toFixed(1)} geral)</span>`;
    const rankLivro  = allLivros.find(l => l.livro === b.livro);
    const capaHtml   = coverThumb(rankLivro?.isbn||'', rankLivro?.coverUrl||'');
    el.innerHTML += `
      <div class="rank-item" onclick="abrirLivroDetalhes('${b.livro.replace(/'/g,"\\'")}');document.getElementById('modal-ranking-completo').style.display='none'" style="cursor:pointer;">
        ${capaHtml}
        <span class="rank-num">${i<3?'':('#'+(i+1))}</span>
        <span class="rank-medal">${medals[i]||''}</span>
        <div style="flex:1;min-width:0">
          <div class="rank-name" data-tip="${b.livro}">${b.livro}</div>
          <span class="rank-year">${b.ano}</span>
        </div>
        <div class="rank-bar-wrap"><div class="rank-bar"><div class="rank-bar-fill" style="width:${pct}%;background:${cor}"></div></div></div>
        <span class="rank-score" style="color:${cor}">${scoreLabel}</span>
      </div>`;
  });
}

// ════════════════════════════════════════════════
// 4. WEEKDAY BARS (HTML) — seletor único
// ════════════════════════════════════════════════
function buildWd() {
  const yr = document.getElementById('selWd')?.value || 'total';

  ['avg','sum'].forEach(type => {
    const src  = type==='avg' ? WD_AVG : WD_SUM;
    const vals = src[yr] || src['total'] || [0,0,0,0,0,0,0];
    const maxV = Math.max(...vals, 1);
    const el   = document.getElementById(type==='avg' ? 'wdAvg' : 'wdSum');
    if (!el) return;
    el.innerHTML = '';
    vals.forEach((v, i) => {
      const h    = Math.max(6, Math.round(v/maxV * 90));
      const disp = type==='avg' ? v.toFixed(0) : v.toLocaleString('pt-BR');
      el.innerHTML += `
        <div class="wd-col">
          <span class="wd-val">${disp}</span>
          <div class="wd-bar" style="height:${h}px;background:${WD_COLORS[i]}"></div>
          <span class="wd-lbl">${WD_LABELS[i]}</span>
        </div>`;
    });
  });
}


function inicializarGraficos() {

// Popular seletores imediatamente com os dados disponíveis
(function() {
  // Seletor anos ranking — usa anos das NOTAS, não das sessões
  const selNotasAno = document.getElementById('selNotasAno');
  const anosNotas = [...new Set(NOTES.map(n => n.ano).filter(a => a > 2000))].sort();
  selNotasAno.innerHTML = '<option value="all">Todos os anos</option>';
  anosNotas.forEach(a => {
    selNotasAno.innerHTML += `<option value="${a}">${a}</option>`;
  });

  // Seletor coleções ranking
  const selNotasColecao = document.getElementById('selNotasColecao');
  if (selNotasColecao) {
    const allLivrosCol = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
    const colecoesNotas = [...new Set(NOTES.map(n => {
      const l = allLivrosCol.find(x => x.livro === n.livro);
      return l?.colecao || '';
    }).filter(Boolean))].sort();
    selNotasColecao.innerHTML = '<option value="all">Todas as coleções</option>';
    colecoesNotas.forEach(c => {
      selNotasColecao.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }

  // Seletor anos dia da semana
  const selWd = document.getElementById('selWd');
  const anosWd = Object.keys(WD_AVG).filter(k => k !== 'total').sort();
  selWd.innerHTML = '<option value="total">Total</option>';
  anosWd.forEach(a => {
    selWd.innerHTML += `<option value="${a}">${a}</option>`;
  });
})();

// ════════════════════════════════════════════════
// CHART DEFAULTS
// ════════════════════════════════════════════════

function baseScales(xRot) {
  return {
    x: { ticks:{ color:TICK_COLOR, font:{size:10}, maxRotation: xRot||0 }, grid:{ color:GRID_COLOR } },
    y: { ticks:{ color:TICK_COLOR }, grid:{ color:GRID_COLOR }, beginAtZero:true }
  };
}

// ════════════════════════════════════════════════
// 1. YEAR BARS (HTML, no chart)
// ════════════════════════════════════════════════
function buildYearBars() {
  const el = document.getElementById('yearBars');
  if (!el) return;
  el.innerHTML = '';
  if (!YEARS || !YEARS.length) return;
  const maxP = Math.max(...YEARS.map(y => y.pag));
  YEARS.forEach((y, i) => {
    const pct = Math.round(y.pag / maxP * 100);
    el.innerHTML += `
      <div class="yr-item">
        <div class="yr-top">
          <span class="yr-name" style="color:${YC[i]}">${y.ano}</span>
          <span class="yr-pag">${y.pag.toLocaleString('pt-BR')} páginas</span>
        </div>
        <div class="bar-bg"><div class="bar-fg" style="width:${pct}%;background:${YC[i]}"></div></div>
        <div class="yr-stats">
          <span>Sessões: <b>${y.sess}</b></span>
          <span>Págs/dia: <b style="color:${YC[i]}">${y.pgdia}</b></span>
          <span>Pág/min: <b>${y.ppm}</b></span>
          <span>Horas: <b>${y.horas}h</b></span>
        </div>
      </div>`;
  });
}
window.buildYearBars = buildYearBars;
buildYearBars();

// ════════════════════════════════════════════════
// 2. MONTHLY CHART
// ════════════════════════════════════════════════
(function() {
  const selFrom = document.getElementById('selFrom');
  const selTo   = document.getElementById('selTo');
  MONTHLY.forEach((d,i) => {
    selFrom.innerHTML += `<option value="${i}">${d.m}</option>`;
    selTo.innerHTML   += `<option value="${i}"${i===MONTHLY.length-1?' selected':''}>${d.m}</option>`;
  });

  let chart = null;
  const ctx = document.getElementById('cMonthly').getContext('2d');
  // Destroi chart existente se houver
  const existingChart = Chart.getChart('cMonthly');
  if (existingChart) existingChart.destroy();

  // Plugin para linhas verticais nos meses de dezembro
  const dezPlugin = {
    id: 'dezLines',
    afterDraw(chart) {
      const { ctx: c, chartArea: { top, bottom }, scales: { x } } = chart;
      chart.data.labels.forEach((label, i) => {
        if (!label.startsWith('Dez')) return;
        const xPos = x.getPixelForValue(i);
        c.save();
        c.beginPath();
        c.strokeStyle = 'rgba(255,255,255,0.25)';
        c.lineWidth = 1;
        c.setLineDash([4, 3]);
        c.moveTo(xPos, top);
        c.lineTo(xPos, bottom);
        c.stroke();
        c.restore();
      });
    }
  };

  function render() {
    const s = parseInt(selFrom.value), e = parseInt(selTo.value);
    if (s >= e) return;
    const slice = MONTHLY.slice(s, e+1);
    if (chart) chart.destroy();
    const g = ctx.createLinearGradient(0,0,0,240);
    g.addColorStop(0,'rgba(139,124,248,.4)');
    g.addColorStop(1,'rgba(139,124,248,0)');
    chart = new Chart(ctx, {
      type:'line',
      data:{
        labels: slice.map(d=>d.m),
        datasets:[{
          data: slice.map(d=>d.v),
          borderColor:'#8b7cf8', backgroundColor:g,
          borderWidth:2, pointRadius:3, pointBackgroundColor:'#8b7cf8',
          fill:true, tension:0.4
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{...TT, callbacks:{label:c=>` ${c.parsed.y.toLocaleString('pt-BR')} páginas`}} },
        scales: baseScales(45)
      },
      plugins: [dezPlugin]
    });
  }

  selFrom.addEventListener('change', render);
  selTo.addEventListener('change', render);
  render();
})();


// ════════════════════════════════════════════════
// 5. DONUT — Coleções e Autores (dinâmico)
// ════════════════════════════════════════════════
let _chartDonut = null, _chartAutores = null;

function buildDonuts() {
  const ano  = document.getElementById('selDonutAno')?.value || 'total';
  const modo = document.getElementById('selDonutModo')?.value || 'lido';
  const sess = window._sessoes || [];
  const livros = window._livros || [];

  // Filtra sessões por ano
  const sessFiltradas = ano === 'total' ? sess : sess.filter(s => s.ano === Number(ano) || String(s.ano) === ano);

  // Função para calcular páginas por livro considerando modo
  function paginasPorLivro(nomeLivro) {
    if (modo === 'lido') {
      return sessFiltradas.filter(s => s.livro === nomeLivro).reduce((a, s) => a + s.paginas, 0);
    } else {
      // totalPag do livro
      const l = livros.find(x => x.livro === nomeLivro);
      return l?.totalPag || 0;
    }
  }

  // Agrupa por coleção
  const colMap = {};
  if (modo === 'lido') {
    sessFiltradas.forEach(s => {
      const col = s.colecao || 'Sem coleção';
      colMap[col] = (colMap[col]||0) + s.paginas;
    });
  } else if (modo === 'livros_lidos') {
    // Conta livros lidos (completos) por coleção
    const lidos = (window._livros||[]).filter(l => l.status === 'Completo');
    const filtrados = ano === 'total' ? lidos : lidos.filter(l => sessFiltradas.some(s=>s.livro===l.livro));
    filtrados.forEach(l => {
      const col = l.colecao || 'Sem coleção';
      colMap[col] = (colMap[col]||0) + 1;
    });
  } else if (modo === 'livros') {
    (window._livros||[]).forEach(l => {
      const col = l.colecao || 'Sem coleção';
      colMap[col] = (colMap[col]||0) + 1;
    });
  } else {
    // tudo — págs totais de todos os livros
    (window._livros||[]).forEach(l => {
      const col = l.colecao || 'Sem coleção';
      colMap[col] = (colMap[col]||0) + (l.totalPag||0);
    });
  }

  const colLabel = (modo === 'livros' || modo === 'livros_lidos') ? ' livros' : ' págs';

  const colSorted = Object.entries(colMap).sort((a,b)=>b[1]-a[1]);
  const COLS = colSorted.slice(0,15).map(([c,p])=>({c,p}));

  // Agrupa por autor
  const autMap = {};
  if (modo === 'lido') {
    sessFiltradas.forEach(s => {
      const aut = (window._livros||[]).find(x=>x.livro===s.livro)?.autor || AUTOR_MAP[s.livro] || 'Desconhecido';
      autMap[aut] = (autMap[aut]||0) + s.paginas;
    });
  } else if (modo === 'livros_lidos') {
    const lidos = (window._livros||[]).filter(l => l.status === 'Completo');
    const filtrados = ano === 'total' ? lidos : lidos.filter(l => sessFiltradas.some(s=>s.livro===l.livro));
    filtrados.forEach(l => {
      const aut = l.autor || AUTOR_MAP[l.livro] || 'Desconhecido';
      autMap[aut] = (autMap[aut]||0) + 1;
    });
  } else if (modo === 'livros') {
    (window._livros||[]).forEach(l => {
      const aut = l.autor || AUTOR_MAP[l.livro] || 'Desconhecido';
      autMap[aut] = (autMap[aut]||0) + 1;
    });
  } else {
    (window._livros||[]).forEach(l => {
      const aut = l.autor || AUTOR_MAP[l.livro] || 'Desconhecido';
      autMap[aut] = (autMap[aut]||0) + (l.totalPag||0);
    });
  }

  const autSorted = Object.entries(autMap).sort((a,b)=>b[1]-a[1]);
  const AUTS = autSorted.slice(0,15).map(([a,p])=>({a,p}));

  // Donut Coleções
  if (_chartDonut) _chartDonut.destroy();
  _chartDonut = new Chart(document.getElementById('cDonut').getContext('2d'), {
    type:'doughnut',
    data:{ labels: COLS.map(c=>c.c), datasets:[{ data:COLS.map(c=>c.p), backgroundColor:DONUT_COLORS, borderColor:'#161b27', borderWidth:3 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
      onClick:(evt,els)=>{ if(els.length) abrirPainelColecao(COLS[els[0].index].c); },
      plugins:{ legend:{display:false}, tooltip:{...TT, callbacks:{label:c=>` ${c.parsed.toLocaleString('pt-BR')}${colLabel}`}} } }
  });
  const tot = COLS.reduce((s,c)=>s+c.p, 0);
  const elD = document.getElementById('donutLeg');
  elD.innerHTML = '';
  let pctUsed = 0;
  COLS.forEach((c,i) => {
    const pct = i === COLS.length-1 ? 100-pctUsed : Math.round(c.p/tot*100);
    pctUsed += pct;
    elD.innerHTML += `<div class="donut-leg-item" style="cursor:pointer;" onclick="abrirPainelColecao('${c.c.replace(/'/g,"\\'")}')">
      <div class="dot" style="background:${DONUT_COLORS[i%DONUT_COLORS.length]}"></div>
      <span class="donut-leg-name">${c.c}</span>
      <span class="donut-leg-pct">${pct}%</span>
    </div>`;
  });

  // Donut Autores
  if (_chartAutores) _chartAutores.destroy();
  _chartAutores = new Chart(document.getElementById('cAutores').getContext('2d'), {
    type:'doughnut',
    data:{ labels: AUTS.map(a=>a.a), datasets:[{ data:AUTS.map(a=>a.p), backgroundColor:DONUT_COLORS, borderColor:'#161b27', borderWidth:3 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
      onClick:(evt,els)=>{ if(els.length) abrirPainelAutor(AUTS[els[0].index].a); },
      plugins:{ legend:{display:false}, tooltip:{...TT, callbacks:{label:c=>` ${c.parsed.toLocaleString('pt-BR')} págs`}} } }
  });
  const totA = AUTS.reduce((s,a)=>s+a.p, 0);
  const elA = document.getElementById('autoresLeg');
  elA.innerHTML = '';
  let pctUsedA = 0;
  AUTS.forEach((a,i) => {
    const pct = i === AUTS.length-1 ? 100-pctUsedA : Math.round(a.p/totA*100);
    pctUsedA += pct;
    elA.innerHTML += `<div class="donut-leg-item" style="cursor:pointer;" onclick="abrirPainelAutor('${a.a.replace(/'/g,"\\'")}')">
      <div class="dot" style="background:${DONUT_COLORS[i%DONUT_COLORS.length]}"></div>
      <span class="donut-leg-name">${a.a}</span>
      <span class="donut-leg-pct">${pct}%</span>
    </div>`;
  });
}
window.buildDonuts = buildDonuts;
window.buildWd = buildWd;
window.buildRanking = buildRanking;
window.buildLivrosMes = buildLivrosMes;
window.buildStreaks = buildStreaks;
window.buildHeatmap = buildHeatmap;
window.buildCalendar = buildCalendar;

// ════════════════════════════════════════════════
// 6. BOOK CHART + BOOK INFO
// ════════════════════════════════════════════════
let _bookChart = null;

function filtrarSelBook(termo) {
  const lista = document.getElementById('selBookLista');
  const statusOrder = {'Lendo':0,'Pausado':1,'Completo':2,'Aguardando':3};
  const base = (window._livros && window._livros.length > 0 ? window._livros : livrosCache);
  const livrosFiltrados = [...base]
    .filter(l => !termo || l.livro.toLowerCase().includes(termo.toLowerCase()))
    .sort((a,b) => {
      const sa = statusOrder[a.status]??9, sb = statusOrder[b.status]??9;
      return sa !== sb ? sa-sb : a.livro.localeCompare(b.livro);
    }).slice(0,20);

  if (!termo || !livrosFiltrados.length) { lista.style.display='none'; return; }
  lista.innerHTML = '';
  livrosFiltrados.forEach(b => {
    const icon = b.status==='Lendo'?'📖':b.status==='Pausado'?'⏸️':b.status==='Completo'?'✅':'📋';
    const item = document.createElement('div');
    item.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);';
    item.textContent = `${icon} ${b.livro}`;
    item.onmouseenter = () => item.style.background = 'var(--bg4)';
    item.onmouseleave = () => item.style.background = '';
    item.addEventListener('mousedown', e => {
      e.preventDefault();
      document.getElementById('selBook').value = b.livro;
      document.getElementById('selBookBusca').value = b.livro;
      lista.style.display = 'none';
      buildBookChart(); buildBookInfo();
    });
    item.addEventListener('touchstart', e => {
      e.preventDefault();
      document.getElementById('selBook').value = b.livro;
      document.getElementById('selBookBusca').value = b.livro;
      lista.style.display = 'none';
      buildBookChart(); buildBookInfo();
    }, {passive:false});
    lista.appendChild(item);
  });
  lista.style.display = 'block';
}
window.filtrarSelBook = filtrarSelBook;

(function() {
  let chart = null;
  const ctx = document.getElementById('cBook').getContext('2d');
  const existingBookChart = Chart.getChart('cBook');
  if (existingBookChart) existingBookChart.destroy();

  window._mostrarZeros = false;
  window.toggleZeros = function() {
    window._mostrarZeros = !window._mostrarZeros;
    const btn = document.getElementById('btn-zeros');
    if (btn) {
      btn.style.background = window._mostrarZeros ? 'rgba(139,124,248,0.2)' : 'var(--bg3)';
      btn.style.color = window._mostrarZeros ? 'var(--purple)' : 'var(--muted)';
      btn.style.borderColor = window._mostrarZeros ? 'var(--purple)' : 'var(--border)';
      btn.textContent = window._mostrarZeros ? '📅 Incluindo dias sem leitura' : '📅 Incluir dias sem leitura';
    }
    if (window.buildBookChart) window.buildBookChart();
  };

  window.buildBookChart = function() {
    const book = document.getElementById('selBook').value;
    let rows = BOOK_DAILY[book] || [];
    const livroData = (window._livros||[]).find(l => l.livro === book);
    const status = livroData?.status || '';
    if (chart) chart.destroy();

    const isPrevisao = (status === 'Aguardando') || (rows.length === 0);
    const isEmAndamento = (status === 'Lendo' || status === 'Pausado') && rows.length > 0;

    // Expande com dias zero se ativado e livro tem histórico real
    if (window._mostrarZeros && rows.length > 1 && !isPrevisao) {
      const expanded = [];
      const start = new Date(rows[0].d + 'T12:00:00');
      const end   = new Date(rows[rows.length-1].d + 'T12:00:00');
      const map   = Object.fromEntries(rows.map(r => [r.d, r.p]));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const key = d.toISOString().slice(0,10);
        expanded.push({ d: key, p: map[key] || 0 });
      }
      rows = expanded;
    }

    if (isPrevisao || isEmAndamento) {
      // Gera previsão baseada na média diária por dia da semana
      const pagLidas = rows.reduce((s,r)=>s+r.p, 0);
      const totalPag = livroData?.totalPag || 300;
      const pagFaltam = totalPag - pagLidas;

      // Média por dia da semana (0=Dom...6=Sab) das sessões globais
      const wdTotals = [0,0,0,0,0,0,0], wdCounts = [0,0,0,0,0,0,0];
      (window._sessoes||[]).forEach(s => {
        if (!s.data) return;
        const wd = new Date(s.data + 'T12:00:00').getDay();
        wdTotals[wd] += s.paginas;
        wdCounts[wd]++;
      });
      const wdAvg = wdTotals.map((t,i) => wdCounts[i] > 0 ? Math.round(t/wdCounts[i]) : 30);

      // Projeta a partir de hoje até acabar o livro
      const today = new Date();
      const forecastLabels = [], forecastData = [], forecastDates = [];
      let pagesLeft = pagFaltam;
      let day = new Date(today);
      while (pagesLeft > 0 && forecastLabels.length < 120) {
        const wd = day.getDay();
        const pags = Math.min(wdAvg[wd], pagesLeft);
        if (pags > 0) {
          forecastLabels.push(day.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}));
          forecastData.push(pags);
          forecastDates.push(new Date(day));
          pagesLeft -= pags;
        }
        day.setDate(day.getDate() + 1);
      }

      // Combina lidas (real) + previsão
      const realLabels = rows.map(r => new Date(r.d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}));
      const realData   = rows.map(r => r.p);
      const allLabels  = [...realLabels, ...forecastLabels];
      const allReal    = [...realData,   ...new Array(forecastLabels.length).fill(null)];
      const allPrev    = [...new Array(realLabels.length).fill(null), ...forecastData];

      const maxP = Math.max(...realData, ...forecastData, 1);

      chart = new Chart(ctx, {
        type:'bar',
        data:{
          labels: allLabels,
          datasets:[
            {
              label:'Lido',
              data: allReal,
              backgroundColor: realData.map(v => {
                const a = 0.35 + 0.65*(v/maxP);
                return `rgba(139,124,248,${a.toFixed(2)})`;
              }),
              borderColor:'rgba(139,124,248,0.8)',
              borderWidth:1, borderRadius:4
            },
            {
              label:'Previsão',
              data: allPrev,
              backgroundColor: 'rgba(78,205,196,0.35)',
              borderColor:'rgba(78,205,196,0.7)',
              borderWidth:1, borderRadius:4,
              borderDash:[4,3]
            }
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            legend:{ labels:{color:TICK_COLOR, font:{size:10}} },
            tooltip:{...TT, callbacks:{
              label: c => c.dataset.label === 'Previsão'
                ? ` ~${c.parsed.y} págs (previsão)`
                : ` ${c.parsed.y} páginas lidas`
            }}
          },
          scales: baseScales(45)
        }
      });

    } else {
      // Livro concluído — mostra histórico real
      const maxP = Math.max(...rows.map(r=>r.p), 1);
      chart = new Chart(ctx, {
        type:'bar',
        data:{
          labels: rows.map(r => new Date(r.d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})),
          datasets:[{
            label:'Páginas',
            data: rows.map(r=>r.p),
            backgroundColor: rows.map(r => {
              const alpha = 0.35 + 0.65*(r.p/maxP);
              return `rgba(139,124,248,${alpha.toFixed(2)})`;
            }),
            borderColor:'rgba(139,124,248,0.8)',
            borderWidth:1, borderRadius:5
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            legend:{display:false},
            tooltip:{...TT, callbacks:{
              title: t => {
                const row = rows[t[0].dataIndex];
                const d = new Date(row.d + 'T12:00:00');
                return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
              },
              label: c => ` ${c.parsed.y} páginas`
            }}
          },
          scales: baseScales(45)
        }
      });
    }
  };

  window.buildBookInfo = function() {
    const book = document.getElementById('selBook').value;
    if (!book) return;

    // Get book data from livros array
    const livroData = (window._livros||[]).find(l => l.livro === book);
    const autorNome = livroData?.autor || AUTOR_MAP[book] || '—';
    const rows = BOOK_DAILY[book] || [];
    const pagLidas = rows.reduce((s,r)=>s+r.p, 0);
    const totalPag = livroData?.totalPag || 0;
    const status = livroData?.status || '—';
    const minutos = (window._sessoes||[]).filter(s=>s.livro===book).reduce((s,r)=>s+(r.minutos||0),0);
    const horas = Math.round(minutos/60*10)/10;
    const diasLidos = [...new Set(rows.map(r=>r.d))].length;
    const mediaDia = diasLidos > 0 ? Math.round(pagLidas/diasLidos) : 0;
    const lendo = status === 'Lendo' || status === 'Pausado';
    const concluido = status === 'Completo';

    const info = document.getElementById('bookInfo');
    info.style.display = 'block';
    document.getElementById('bookInfoCapa').innerHTML    = coverImg(livroData?.isbn, '📖', '', livroData?.coverUrl||'');
    document.getElementById('bookInfoNome').textContent  = book;
    document.getElementById('bookInfoAutor').textContent = autorNome;
    // Ano de leitura
    const anosLidos = [...new Set(rows.map(r => r.d?.slice(0,4)).filter(Boolean))].sort();
    const anoLabel = anosLidos.length === 1 ? anosLidos[0] : anosLidos.length > 1 ? `${anosLidos[0]} – ${anosLidos[anosLidos.length-1]}` : '—';
    document.getElementById('bookInfoAutor').textContent = `${autorNome} · ${anoLabel}`;

    const stats = document.getElementById('bookInfoStats');
    stats.innerHTML = `
      <div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;">
        <div style="font-size:18px;font-weight:700;color:var(--purple)">${totalPag.toLocaleString('pt-BR')}</div>
        <div style="font-size:11px;color:var(--muted)">Páginas totais</div>
      </div>
      <div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;">
        <div style="font-size:18px;font-weight:700;color:var(--teal)">${pagLidas.toLocaleString('pt-BR')}</div>
        <div style="font-size:11px;color:var(--muted)">${lendo ? 'Páginas lidas' : concluido ? 'Páginas lidas' : 'Páginas lidas'}</div>
      </div>
      <div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;">
        <div style="font-size:18px;font-weight:700;color:var(--yellow)">${horas}h</div>
        <div style="font-size:11px;color:var(--muted)">${concluido ? 'Tempo lido' : 'Tempo estimado gasto'}</div>
      </div>
      <div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;">
        <div style="font-size:18px;font-weight:700;color:var(--orange)">${diasLidos}</div>
        <div style="font-size:11px;color:var(--muted)">${concluido ? 'Dias lidos' : 'Dias lidos até agora'}</div>
      </div>
      ${lendo ? `
      <div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;grid-column:1/-1;">
        <div style="font-size:18px;font-weight:700;color:var(--coral)">~${Math.ceil((totalPag-pagLidas)/Math.max(mediaDia,1))} dias</div>
        <div style="font-size:11px;color:var(--muted)">Estimativa para terminar (${mediaDia} págs/dia)</div>
      </div>` : ''}
      <div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;grid-column:1/-1;">
        <div style="font-size:13px;font-weight:600;color:${status==='Completo'?'var(--teal)':status==='Lendo'?'var(--purple)':status==='Pausado'?'var(--orange)':'var(--muted)'}">${status}</div>
        <div style="font-size:11px;color:var(--muted)">Status</div>
      </div>
      ${(()=>{
        const notaLivro = (window.NOTES||[]).find(n=>n.livro===book);
        if(!notaLivro) return '';
        const criterios = notaLivro.criterios||{};
        const criteriosHtml = Object.entries(criterios).map(([k,v])=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:12px;color:var(--muted);">${k}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:80px;height:4px;background:var(--bg2);border-radius:2px;overflow:hidden;">
                <div style="width:${v*10}%;height:100%;background:var(--purple);border-radius:2px;"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:var(--text);min-width:24px;text-align:right;">${v}</span>
            </div>
          </div>`).join('');
        return `<div style="background:var(--bg3);border-radius:8px;padding:8px;grid-column:1/-1;">
          <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div style="font-size:11px;color:var(--muted);">Nota Média</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:18px;font-weight:700;color:var(--yellow)">⭐ ${notaLivro.media.toFixed(1)}</span>
              <span style="font-size:10px;color:var(--muted);">▼ ver detalhes</span>
            </div>
          </div>
          <div style="display:none;margin-top:10px;">${criteriosHtml}</div>
        </div>`;
      })()}`;
  };

  buildBookChart();
  buildBookInfo();
})();

// ════════════════════════════════════════════════
// 7. HEATMAP
// ════════════════════════════════════════════════
(function() {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const byYearMonth = {};
  MONTHLY.forEach(d => {
    const parts = d.m.split('/');
    const mon = parts[0];
    const yr  = '20' + parts[1];
    if (!byYearMonth[yr]) byYearMonth[yr] = new Array(12).fill(0);
    const mIdx = months.indexOf(mon);
    if (mIdx >= 0) byYearMonth[yr][mIdx] = d.v;
  });

  const years = Object.keys(byYearMonth).sort();
  const yColors = ['#8b7cf8','#f88c6a','#4ecdc4','#ffd166'];
  const datasets = years.map((yr, i) => ({
    label: yr,
    data: byYearMonth[yr],
    backgroundColor: yColors[i % yColors.length],
    borderRadius: 4
  }));

  const canv = document.getElementById('cHeat');
  const existing = Chart.getChart(canv);
  if (existing) existing.destroy();

  new Chart(canv.getContext('2d'), {
    type:'bar',
    data:{ labels: months, datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ labels:{color:TICK_COLOR, font:{size:11}} },
        tooltip:{...TT, callbacks:{label:c=>` ${c.dataset.label}: ${c.parsed.y.toLocaleString('pt-BR')} págs`}}
      },
      scales: baseScales(0)
    }
  });
})();

// Popular seletor de anos dos donuts
const selDonutAno = document.getElementById('selDonutAno');
if (selDonutAno) {
  selDonutAno.innerHTML = '<option value="total">Todos os anos</option>';
  const anosDonut = [...new Set((window._sessoes||[]).map(s=>s.ano).filter(a=>a>2000))].sort();
  anosDonut.forEach(a => selDonutAno.innerHTML += `<option value="${a}">${a}</option>`);
}

} // fim inicializarGraficos

function buildLivrosMes() {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const yr = document.getElementById('selWd')?.value || 'total';

  // Pega último dia de sessão por livro
  const ultimaSessao = {};
  (window._sessoes || []).forEach(s => {
    if (!s.data) return;
    if (!ultimaSessao[s.livro] || s.data > ultimaSessao[s.livro])
      ultimaSessao[s.livro] = s.data;
  });

  // Filtra livros concluídos e conta por mês
  const byMesAno = {};
  (window._livros || []).filter(l => l.status === 'Completo').forEach(l => {
    const data = ultimaSessao[l.livro];
    if (!data) return;
    const livroAno = data.slice(0,4);
    if (yr !== 'total' && livroAno !== yr) return;
    const mon = parseInt(data.slice(5,7)) - 1;
    const key = `${livroAno}-${String(mon+1).padStart(2,'0')}`;
    byMesAno[key] = (byMesAno[key] || 0) + 1;
  });

  const sorted = Object.keys(byMesAno).sort().slice(-18);
  const el = document.getElementById('livrosMes');
  if (!el || sorted.length === 0) { if(el) el.innerHTML = '<div style="color:var(--muted);font-size:11px;padding:8px">Nenhum livro concluído</div>'; return; }
  const maxV = Math.max(...sorted.map(k => byMesAno[k]), 1);
  el.innerHTML = '';
  sorted.forEach(k => {
    const [y, mo] = k.split('-');
    const label = meses[parseInt(mo)-1] + '/' + y.slice(2);
    const v = byMesAno[k];
    const h = Math.max(6, Math.round(v/maxV * 70));
    el.innerHTML += `
      <div class="wd-col">
        <span class="wd-val">${v}</span>
        <div class="wd-bar" style="height:${h}px;background:#4ecdc4"></div>
        <span class="wd-lbl" style="font-size:8px;">${label}</span>
      </div>`;
  });
}

function buildGeneros() {
  const el = document.getElementById('cGeneros');
  if (!el) return;
  const existing = Chart.getChart(el);
  if (existing) existing.destroy();

  const allLivros = [...(window._livros||[]), ...(window._dadosD?.lendo||[]), ...(window._dadosD?.pausados||[])];
  const genMap = {};
  allLivros.filter(l => l.status === 'Completo' && l.genero).forEach(l => {
    genMap[l.genero] = (genMap[l.genero] || 0) + 1;
  });

  const total = Object.values(genMap).reduce((a,b)=>a+b,0) || 1;
  const sorted = Object.entries(genMap).sort((a,b) => b[1]-a[1]).slice(0, 10);
  if (!sorted.length) {
    el.parentElement.innerHTML = '<div style="color:var(--muted);font-size:11px;padding:16px;text-align:center;">Nenhum gênero cadastrado ainda.<br>Adicione via ✏️ Atualizar Livro.</div>';
    return;
  }

  const CORES = ['#8b7cf8','#4ecdc4','#f88c6a','#ffd700','#ff6384','#36a2eb','#9966ff','#ff9f40','#4bc0c0','#c9cbcf'];
  new Chart(el, {
    type: 'bar',
    data: {
      labels: sorted.map(([g]) => g),
      datasets: [{
        data: sorted.map(([,n]) => Math.round(n/total*100)),
        backgroundColor: sorted.map((_,i) => CORES[i%CORES.length]),
        borderRadius: 4, borderWidth: 0,
        barThickness: 22
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      onClick: (evt, els) => {
        if (!els.length) return;
        const genero = sorted[els[0].index][0];
        abrirPainelGenero(genero);
      },
      plugins: {
        legend: { display: false },
        tooltip: { ...window.TT, callbacks: {
          label: c => ` ${c.parsed.x}% (${sorted[c.dataIndex][1]} livros)`
        }}
      },
      scales: {
        x: { ticks:{ color:'#8892a8', font:{size:11}, callback:v=>v+'%' }, grid:{ color:'rgba(42,50,72,0.3)' }, beginAtZero:true, max:100 },
        y: { ticks:{ color:'#8892a8', font:{size:13} }, grid:{ display:false } }
      }
    }
  });
}
window.buildGeneros = buildGeneros;

// ── Gráfico Drill-down ─────────────────────────────────────────────
let _ddModo = 'mes';
let _ddOffset = 0;
let _ddChart = null;
let _ddLivroColors = {};
const _ddPaleta = ['#8b7cf8','#5eead4','#fbbf24','#f87171','#34d399','#60a5fa','#a78bfa','#fb923c','#f472b6','#4ade80','#e879f9','#38bdf8'];

function ddGetLivroColor(livro) {
  if (!_ddLivroColors[livro]) {
    const idx = Object.keys(_ddLivroColors).length % _ddPaleta.length;
    _ddLivroColors[livro] = _ddPaleta[idx];
  }
  return _ddLivroColors[livro];
}

function ddSetModo(modo) {
  _ddModo = modo;
  _ddOffset = 0;
  document.getElementById('dd-btn-semana').style.background = modo === 'semana' ? 'var(--purple)' : 'var(--bg3)';
  document.getElementById('dd-btn-semana').style.color = modo === 'semana' ? 'white' : 'var(--text)';
  document.getElementById('dd-btn-mes').style.background = modo === 'mes' ? 'var(--purple)' : 'var(--bg3)';
  document.getElementById('dd-btn-mes').style.color = modo === 'mes' ? 'white' : 'var(--text)';
  buildDrilldown();
}
window.ddSetModo = ddSetModo;

function ddNavegar(dir) {
  _ddOffset += dir;
  buildDrilldown();
}
window.ddNavegar = ddNavegar;

function ddGetPeriodo() {
  const hoje = new Date(); hoje.setHours(12,0,0,0);
  if (_ddModo === 'semana') {
    const dow = hoje.getDay(); // 0=dom
    const seg = new Date(hoje); seg.setDate(hoje.getDate() - dow + (_ddOffset * 7));
    const dom = new Date(seg); dom.setDate(seg.getDate() + 6);
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(seg); d.setDate(seg.getDate() + i);
      dias.push(d.toISOString().slice(0,10));
    }
    const label = `${seg.getDate().toString().padStart(2,'0')}/${(seg.getMonth()+1).toString().padStart(2,'0')} – ${dom.getDate().toString().padStart(2,'0')}/${(dom.getMonth()+1).toString().padStart(2,'0')}`;
    return { dias, label };
  } else {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() + _ddOffset, 1);
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const label = `${meses[ref.getMonth()]} ${ref.getFullYear()}`;
    const daysInMonth = new Date(ref.getFullYear(), ref.getMonth()+1, 0).getDate();
    const dias = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dias.push(`${ref.getFullYear()}-${String(ref.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    }
    return { dias, label };
  }
}

function buildDrilldown() {
  const sess = window._sessoes || [];
  const { dias, label } = ddGetPeriodo();
  document.getElementById('dd-label').textContent = label;

  // Agrupar sessões por dia e livro
  const dadosPorDia = {};
  dias.forEach(d => { dadosPorDia[d] = {}; });
  sess.forEach(s => {
    if (!s.data || !dias.includes(s.data)) return;
    if (!dadosPorDia[s.data][s.livro]) dadosPorDia[s.data][s.livro] = 0;
    dadosPorDia[s.data][s.livro] += s.paginas || 0;
  });

  // Livros presentes no período
  const livrosPresentes = [...new Set(
    Object.values(dadosPorDia).flatMap(d => Object.keys(d))
  )];

  // Labels dos dias
  const labels = dias.map(d => {
    const dt = new Date(d + 'T12:00:00');
    const nomes = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    return `${nomes[dt.getDay()]} ${dt.getDate()}`;
  });

  // Datasets — um por livro, empilhado
  const datasets = livrosPresentes.map(livro => ({
    label: livro,
    data: dias.map(d => dadosPorDia[d][livro] || 0),
    backgroundColor: ddGetLivroColor(livro),
    borderRadius: 3,
    stack: 'stack'
  }));

  // Destruir chart anterior
  if (_ddChart) { _ddChart.destroy(); _ddChart = null; }
  const ddEl = document.getElementById('cDrilldown');
  if (!ddEl) return;
  // Sempre destruir qualquer chart existente no canvas
  const existingDD = Chart.getChart(ddEl);
  if (existingDD) existingDD.destroy();
  const ddParent = ddEl.parentElement;
  if (ddParent) { ddEl.style.width = '100%'; ddEl.style.height = (ddParent.offsetHeight || 260) + 'px'; }
  const ctx = ddEl.getContext('2d');

  _ddChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      onClick: (evt, els) => {
        if (!els.length) return;
        const diaIdx = els[0].index;
        const dia = dias[diaIdx];
        ddMostrarDetalhe(dia, dadosPorDia[dia]);
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => {
              const dia = dias[items[0].dataIndex];
              const total = Object.values(dadosPorDia[dia]).reduce((a,b)=>a+b,0);
              return `${labels[items[0].dataIndex]} — ${total} págs total`;
            },
            label: item => ` ${item.dataset.label}: ${item.parsed.y} págs`
          }
        }
      },
      scales: {
        x: { stacked: true, ticks: { color: '#8892a8', font: { size: 11 } }, grid: { display: false } },
        y: { stacked: true, ticks: { color: '#8892a8' }, grid: { color: 'rgba(42,50,72,0.3)' }, beginAtZero: true }
      }
    }
  });

  // Legenda
  const legEl = document.getElementById('dd-legenda');
  legEl.innerHTML = livrosPresentes.map(l =>
    `<div style="display:flex;align-items:center;gap:4px;">
      <div style="width:10px;height:10px;border-radius:2px;background:${ddGetLivroColor(l)};flex-shrink:0;"></div>
      <span style="font-size:11px;color:var(--muted);">${l.length > 25 ? l.slice(0,25)+'…' : l}</span>
    </div>`
  ).join('');

  document.getElementById('dd-detalhe').style.display = 'none';
}
window.buildDrilldown = buildDrilldown;

function ddMostrarDetalhe(dia, dados) {
  const el = document.getElementById('dd-detalhe');
  const dt = new Date(dia + 'T12:00:00');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const total = Object.values(dados).reduce((a,b)=>a+b,0);
  if (!total) { el.style.display = 'none'; return; }
  const sessoesDia = (window._sessoes||[]).filter(s => s.data === dia);
  const minutosDia = sessoesDia.reduce((a,s)=>a+(s.minutos||0),0);

  el.style.display = 'block';
  el.innerHTML = `<div style="font-weight:700;margin-bottom:8px;color:var(--text);">
    📅 ${dt.getDate()} ${meses[dt.getMonth()]} ${dt.getFullYear()} — <span style="color:var(--teal);">${total} págs</span>${minutosDia ? ` · ${Math.round(minutosDia)}min` : ''}
  </div>` +
  Object.entries(dados).map(([livro, pags]) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${ddGetLivroColor(livro)};flex-shrink:0;"></div>
      <span style="flex:1;font-size:12px;">${livro}</span>
      <span style="font-size:12px;font-weight:700;color:var(--teal);">${pags} págs</span>
    </div>`).join('');
}
window.ddMostrarDetalhe = ddMostrarDetalhe;

function _abrirPainelOverlay(titulo, livros) {
  const painel = document.getElementById('painelGenero');
  const overlay = document.getElementById('painelGeneroOverlay');
  const tituloEl = document.getElementById('painelGeneroTitulo');
  const lista = document.getElementById('painelGeneroLista');
  if (!painel || !tituloEl || !lista) return;
  tituloEl.textContent = titulo;
  lista.innerHTML = livros.map(l => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg3);border-radius:10px;cursor:pointer;" onclick="fecharPainelGenero();abrirLivroDetalhes('${l.livro.replace(/'/g,"\\'")}')">
      ${l.coverUrl ? `<img src="${l.coverUrl}" style="width:36px;height:50px;object-fit:cover;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none'">` : ''}
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.livro}</div>
        <div style="font-size:12px;color:var(--muted);">${l.autor||''} ${l.colecao?'· '+l.colecao:''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:15px;font-weight:700;color:var(--teal);">${(l.totalPag||0).toLocaleString('pt-BR')}</div>
        <div style="font-size:10px;color:var(--muted);">págs</div>
      </div>
    </div>`).join('');
  painel.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
}

function abrirPainelColecao(colecao) {
  const allLivros = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[])];
  const livros = allLivros.filter(l => l.colecao === colecao).sort((a,b)=>(a.ordemColecao||0)-(b.ordemColecao||0)||(a.livro.localeCompare(b.livro)));
  _abrirPainelOverlay(`📦 ${colecao} — ${livros.length} livro${livros.length!==1?'s':''}`, livros);
}
window.abrirPainelColecao = abrirPainelColecao;

function abrirPainelAutor(autor) {
  const allLivros = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[])];
  const livros = allLivros.filter(l => l.autor === autor).sort((a,b)=>a.livro.localeCompare(b.livro));
  _abrirPainelOverlay(`✍️ ${autor} — ${livros.length} livro${livros.length!==1?'s':''}`, livros);
}
window.abrirPainelAutor = abrirPainelAutor;

function abrirPainelGenero(genero) {
  const painel = document.getElementById('painelGenero');
  const overlay = document.getElementById('painelGeneroOverlay');
  const titulo = document.getElementById('painelGeneroTitulo');
  const lista  = document.getElementById('painelGeneroLista');
  if (!painel || !titulo || !lista) return;

  const allLivros = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
  const livrosGenero = allLivros.filter(l => l.genero === genero && l.status === 'Completo').sort((a,b)=>a.livro.localeCompare(b.livro));

  titulo.textContent = `🌎 ${genero} — ${livrosGenero.length} livro${livrosGenero.length!==1?'s':''}`;
  lista.innerHTML = livrosGenero.map(l => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg3);border-radius:10px;">
      <div style="flex-shrink:0;">${l.coverUrl ? `<img src="${l.coverUrl}" style="width:36px;height:50px;object-fit:cover;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none'">` : ''}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.livro}</div>
        <div style="font-size:12px;color:var(--muted);">${l.autor||''} ${l.colecao?'· '+l.colecao:''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:15px;font-weight:700;color:var(--teal);">${l.totalPag?.toLocaleString('pt-BR')||'—'}</div>
        <div style="font-size:10px;color:var(--muted);">págs</div>
      </div>
    </div>`).join('');

  painel.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
}
window.abrirPainelGenero = abrirPainelGenero;

function fecharPainelGenero() {
  const painel = document.getElementById('painelGenero');
  const overlay = document.getElementById('painelGeneroOverlay');
  if (painel) painel.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
}
window.fecharPainelGenero = fecharPainelGenero;
function buildStreaks() {
  const sess = window._sessoes || [];
  const diasSet = [...new Set(sess.map(s => s.data).filter(Boolean))].sort();
  if (!diasSet.length) {
    document.getElementById('streakAtual')?.textContent && (document.getElementById('streakAtual').textContent = '0');
    document.getElementById('streakRecorde')?.textContent && (document.getElementById('streakRecorde').textContent = '0');
    const rd = document.getElementById('streakRecordeData'); if(rd) rd.textContent = 'dias seguidos';
    const sl = document.getElementById('streakList'); if(sl) sl.innerHTML = '';
    return;
  }

  // Calcula todas as sequências
  const streaks = [];
  let cur = [diasSet[0]];
  for (let i = 1; i < diasSet.length; i++) {
    const prev = new Date(diasSet[i-1] + 'T12:00:00');
    const curr = new Date(diasSet[i]   + 'T12:00:00');
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      cur.push(diasSet[i]);
    } else {
      streaks.push([...cur]);
      cur = [diasSet[i]];
    }
  }
  streaks.push(cur);

  // Streak atual
  const hoje = new Date();
  const ontem = new Date(hoje.getTime() - 86400000);
  const hojeStr  = hoje.toISOString().slice(0,10);
  const ontemStr = ontem.toISOString().slice(0,10);
  const ultimoStr = diasSet[diasSet.length-1];
  let streakAtual = 0;
  if (ultimoStr === hojeStr || ultimoStr === ontemStr) {
    const last = streaks[streaks.length-1];
    streakAtual = last.length;
  }

  // Recorde
  const recorde = streaks.reduce((m, s) => s.length > m.length ? s : m, []);

  document.getElementById('streakAtual').textContent    = streakAtual;
  document.getElementById('streakRecorde').textContent  = recorde.length;
  document.getElementById('streakRecordeData').textContent =
    recorde.length ? `${fmtDate(recorde[0])} → ${fmtDate(recorde[recorde.length-1])}` : '';

  // Últimas 5 sequências
  const list = document.getElementById('streakList');
  list.innerHTML = '';
  [...streaks].reverse().filter(s => s.length > 1).slice(0,5).forEach(s => {
    const sessDia = sess.filter(r => s.includes(r.data));
    const totalPags = sessDia.reduce((a,r)=>a+r.paginas,0);
    const totalMin  = Math.round(sessDia.reduce((a,r)=>a+r.minutos,0));
    // Livros únicos nessa sequência
    const livrosSeq = {};
    sessDia.forEach(r => {
      if (!livrosSeq[r.livro]) livrosSeq[r.livro] = {pags:0, min:0};
      livrosSeq[r.livro].pags += r.paginas;
      livrosSeq[r.livro].min  += r.minutos;
    });

    let livrosHtml = Object.entries(livrosSeq).map(([livro, v]) => {
      const ld = (window._livros||[]).find(l=>l.livro===livro);
      const isbn = ld?.isbn || '';
      const customUrl = ld?.coverUrl || '';
      const capa = coverThumb(isbn, customUrl);
      return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-top:1px solid var(--border)">
        ${capa}
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${livro}</div>
          <div style="font-size:11px;color:var(--muted)">${ld?.autor||''}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-weight:700;color:var(--teal)">${v.pags} páginas</div>
          <div style="font-size:11px;color:var(--muted)">${Math.round(v.min)}min</div>
        </div>
      </div>`;
    }).join('');

    list.innerHTML += `<div style="background:var(--bg3);border-radius:8px;padding:10px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:13px;font-weight:700;color:var(--text)">${fmtDate(s[0])} → ${fmtDate(s[s.length-1])}</span>
        <div style="display:flex;gap:8px;">
          <span style="font-size:11px;color:var(--purple);font-weight:700">📅 ${s.length} dias</span>
          <span style="font-size:11px;color:var(--teal);font-weight:700">📄 ${totalPags.toLocaleString('pt-BR')} págs</span>
          <span style="font-size:11px;color:var(--yellow);font-weight:700">⏱ ${totalMin}min</span>
        </div>
      </div>
      ${livrosHtml}
    </div>`;
  });
}

function fmtDate(d) {
  return new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
}

// ════════════════════════════════════════════════
// HEATMAP — mapa de calor anual tipo GitHub
// ════════════════════════════════════════════════
function buildHeatmap() {
  const yr = parseInt(document.getElementById('selHeatYear')?.value || new Date().getFullYear());
  const sess = window._sessoes || [];

  const dayMap = {};
  sess.filter(s => s.data && s.data.startsWith(yr)).forEach(s => {
    dayMap[s.data] = (dayMap[s.data]||0) + s.paginas;
  });

  const vals = Object.values(dayMap);
  const maxVal = vals.length ? Math.max(...vals) : 1;

  function getColor(v) {
    if (!v) return 'var(--bg3)';
    const pct = v / maxVal;
    if (pct < 0.2) return '#1a3a5c';
    if (pct < 0.4) return '#1e5f8e';
    if (pct < 0.7) return '#2980b9';
    return '#8b7cf8';
  }

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const diasSem = ['D','S','T','Q','Q','S','S'];

  const isMobile = window.innerWidth < 600;
  const cols = isMobile ? 2 : 4;
  let html = `<div data-desktop-grid="1" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${isMobile?10:16}px;">`;

  for (let mo = 0; mo < 12; mo++) {
    const daysInMonth = new Date(yr, mo+1, 0).getDate();
    const firstDay = new Date(yr, mo, 1).getDay(); // 0=Dom

    html += `<div>
      <div style="font-size:${isMobile?11:13}px;font-weight:700;color:var(--text);margin-bottom:4px;">${meses[mo]}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:${isMobile?1:2}px;margin-bottom:4px;">`;

    // Cabeçalho dias da semana
    diasSem.forEach(d => {
      html += `<div style="font-size:10px;color:var(--muted);text-align:center;font-weight:600;">${d}</div>`;
    });

    // Células vazias antes do dia 1
    for (let i = 0; i < firstDay; i++) {
      html += `<div></div>`;
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const pags = dayMap[dateStr] || 0;
      const color = getColor(pags);
      const textColor = pags ? 'white' : 'var(--muted)';
      const title = pags ? `${day} — ${pags} págs` : String(day);
      html += `<div data-tip="${title}" style="
        aspect-ratio:1;
        background:${color};
        border-radius:4px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:10px;
        font-weight:${pags?'700':'400'};
        color:${textColor};
        cursor:${pags?'pointer':'default'};
        border: 1px solid rgba(255,255,255,0.06);
      ">${day}</div>`;
    }

    html += `</div></div>`;
  }

  html += `</div>`;
  document.getElementById('heatmapGrid').innerHTML = html;

  // Popular seletor de anos
  const sel = document.getElementById('selHeatYear');
  const anos = [...new Set((window._sessoes||[]).map(s=>s.data?.slice(0,4)).filter(Boolean))].sort();
  sel.innerHTML = '';
  anos.forEach(a => sel.innerHTML += `<option value="${a}" ${a==yr?'selected':''}>${a}</option>`);
}

// ════════════════════════════════════════════════
// CALENDÁRIO MENSAL
// ════════════════════════════════════════════════
function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  buildCalendar();
}
window.calNav = calNav;

function buildCalendar() {
  const sess = window._sessoes || [];
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dias  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  document.getElementById('calTitle').textContent = `${meses[calMonth]} ${calYear}`;

  // Agrupa sessões por dia nesse mês
  const prefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const dayData = {};
  sess.filter(s => s.data?.startsWith(prefix)).forEach(s => {
    if (!dayData[s.data]) dayData[s.data] = [];
    dayData[s.data].push(s);
  });

  const maxPag = Math.max(...Object.values(dayData).map(v=>v.reduce((a,r)=>a+r.paginas,0)), 1);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();

  let html = '';
  // Cabeçalho
  dias.forEach(d => {
    html += `<div style="text-align:center;font-size:11px;font-weight:700;color:var(--muted);padding:4px 0;">${d}</div>`;
  });
  // Células vazias antes do dia 1
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-empty"></div>';

  // Dias
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const entries = dayData[dateStr] || [];
    const totalPag = entries.reduce((a,r)=>a+r.paginas,0);
    const barW = totalPag ? Math.round(totalPag/maxPag*100) : 0;
    const isSelected = calSelected === dateStr;

    // Agrupa por livro
    const byBook = {};
    entries.forEach(e => { byBook[e.livro] = (byBook[e.livro]||0) + e.paginas; });
    const livrosHtml = Object.entries(byBook).map(([livro, pags]) =>
      `<div style="font-size:10px;line-height:1.3;margin-top:2px;overflow:hidden;">
        <span style="color:var(--teal);font-weight:700;font-size:13px">${pags} páginas</span>
        <span style="color:var(--text);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;">${livro}</span>
      </div>`
    ).join('');

    html += `<div class="cal-day${totalPag?' active':''}${isSelected?' selected':''}" onclick="calSelect('${dateStr}')">
      <div class="cal-day-num">${day}</div>
      ${totalPag ? `${livrosHtml}<div class="cal-day-bar" style="width:${barW}%"></div>` : ''}
    </div>`;
  }

  document.getElementById('calGrid').innerHTML = html;

  // Reopen detail if selected day is in this month
  if (calSelected?.startsWith(prefix)) {
    calShowDetail(calSelected);
  } else {
    document.getElementById('calDetail').style.display = 'none';
    calSelected = null;
  }
}

function calSelect(dateStr) {
  if (calSelected === dateStr) {
    calSelected = null;
    document.getElementById('calDetail').style.display = 'none';
    buildCalendar();
    return;
  }
  calSelected = dateStr;
  buildCalendar();
}

function calShowDetail(dateStr) {

  const sess = window._sessoes || [];
  const entries = sess.filter(s => s.data === dateStr);
  const d = new Date(dateStr + 'T12:00:00');
  const label = d.toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});

  const detail = document.getElementById('calDetail');
  const totalPag = entries.reduce((a,r)=>a+r.paginas,0);
  const totalMin = entries.reduce((a,r)=>a+r.minutos,0);

  document.getElementById('calDetailTitle').innerHTML =
    `📅 ${label} — <span style="color:var(--teal)">${totalPag} páginas</span> · <span style="color:var(--yellow)">${Math.round(totalMin)}min</span>`;

  let listHtml = '';
  // Agrupa por livro
  const byBook = {};
  entries.forEach(e => {
    if (!byBook[e.livro]) byBook[e.livro] = {pags:0, min:0};
    byBook[e.livro].pags += e.paginas;
    byBook[e.livro].min  += e.minutos;
  });

  Object.entries(byBook).forEach(([livro, v]) => {
    const livroData = (window._livros||[]).find(l=>l.livro===livro);
    const isbn = livroData?.isbn || '';
    const customUrl = livroData?.coverUrl || '';
    const capaHtml = coverImg(isbn, '📖', '', customUrl)
      .replace('width:60px;height:84px', 'width:48px;height:68px')
      .replace('font-size:32px', 'font-size:22px');
    const horas = v.min >= 60 ? `${Math.floor(v.min/60)}h ${Math.round(v.min%60)}min` : `${Math.round(v.min)}min`;
    listHtml += `<div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--bg2);border-radius:10px;margin-bottom:8px;">
      <div style="flex-shrink:0;display:flex;align-items:center;">${capaHtml}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:20px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:3px;">${livro}</div>
        <div style="font-size:16px;color:var(--muted);margin-bottom:10px;">${livroData?.autor||''}</div>
        <div style="display:flex;gap:16px;">
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--teal)">${v.pags}</div>
            <div style="font-size:11px;color:var(--muted)">páginas</div>
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--yellow)">${horas}</div>
            <div style="font-size:11px;color:var(--muted)">tempo lido</div>
          </div>
        </div>
      </div>
    </div>`;
  });

  document.getElementById('calDetailList').innerHTML = listHtml || '<div style="color:var(--muted);font-size:13px">Nenhuma sessão registrada</div>';
  detail.style.display = 'block';
}
window.calSelect = calSelect;
window.calShowDetail = calShowDetail;

function buildMeta() {
  const ano = document.getElementById('selMetaAno')?.value || '2026';
  const m = (window._metasPorAno || {})[ano] || {};

  const total      = m.total      || 0;
  const lidos      = m.lidos      || 0;
  const pagLidas   = m.paginasLidas   || 0;
  const pagTotal   = m.paginasTotal   || 0;
  const pagFalt    = m.paginasFaltando || 0;
  const ritmo      = m.ritmoAtual  || 0;
  const mediaDia   = m.mediaDiaria || 0;
  const pctPag     = pagTotal > 0 ? pagLidas / pagTotal : (total > 0 ? lidos / total : 0);
  const ringOffset = 314.16 * (1 - Math.min(pctPag, 1));

  document.getElementById('metaCardTitle').textContent   = `🎯 Meta ${ano} — ${total} Livros`;
  document.getElementById('meta-ring-circle').setAttribute('stroke-dashoffset', ringOffset.toFixed(1));
  document.getElementById('meta-ring-pct').textContent   = (pctPag*100).toFixed(1).replace('.',',') + '%';
  document.getElementById('meta-pag-lidas').textContent  = pagLidas.toLocaleString('pt-BR');
  document.getElementById('meta-pag-falt').textContent   = pagFalt.toLocaleString('pt-BR');
  document.getElementById('meta-pag-total').textContent  = pagTotal.toLocaleString('pt-BR');
  document.getElementById('meta-livros').textContent     = lidos + ' / ' + total;
  // Calcular págs/dia necessárias para bater a meta até 31/12
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const fimAno = new Date(parseInt(ano), 11, 31); fimAno.setHours(0,0,0,0);
  const diasRestantes = Math.max(1, Math.ceil((fimAno - hoje) / 86400000));
  const pagDiaNec = pagFalt > 0 ? Math.ceil(pagFalt / diasRestantes) : 0;

  document.getElementById('meta-pgdia').textContent = pagDiaNec > 0 ? pagDiaNec + ' págs/dia' : '✅ Meta batida!';
  document.getElementById('meta-ritmo').textContent      = ritmo > 0 ? ritmo.toFixed(1) + ' págs/dia' : '—';
  document.getElementById('meta-media-ano').textContent  = mediaDia > 0 ? mediaDia.toFixed(1) + ' págs/dia' : '—';
  document.getElementById('meta-data-ini').textContent   = '—';
  document.getElementById('meta-data-atual').textContent = m.dataPrevistoAtual || '—';
  const anoFinalEl = document.getElementById('meta-ano-final');
  if (anoFinalEl) anoFinalEl.textContent = ano;
}
window.buildMeta = buildMeta;

function abrirPainelMeta() {
  const ano = document.getElementById('selMetaAno')?.value || '2026';
  const painel = document.getElementById('painelMeta');
  const overlay = document.getElementById('painelMetaOverlay');
  const titulo = document.getElementById('painelMetaTitulo');
  const lista = document.getElementById('painelMetaLista');
  if (!painel) return;

  const u = usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual;
  const allLivros = [...(window._livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
  // Deduplica por nome e filtra pelo usuário correto
  const seen = new Set();
  const livrosMeta = allLivros.filter(l => {
    if (String(l.metaAno) !== String(ano)) return false;
    const userOk = u === 'Milton'
      ? (!l.usuario || l.usuario === '' || l.usuario.toUpperCase() === 'MILTON')
      : l.usuario?.toUpperCase() === u.toUpperCase();
    if (!userOk) return false;
    if (seen.has(l.livro)) return false;
    seen.add(l.livro);
    return true;
  })
    .sort((a,b) => {
      const ord = {Lendo:0,Pausado:1,Aguardando:2,Completo:3};
      return (ord[a.status]??9)-(ord[b.status]??9) || a.livro.localeCompare(b.livro);
    });

  const statusIcon = {
    Completo:  { icon:'✅', color:'#22c55e' },
    Lendo:     { icon:'📖', color:'#3b82f6' },
    Pausado:   { icon:'⏸️', color:'#ef4444' },
    Aguardando:{ icon:'⏳', color:'#e2e8f0' },
  };

  titulo.textContent = `🎯 Meta ${ano} — ${livrosMeta.length} livros`;
  lista.innerHTML = livrosMeta.map(l => {
    const st = statusIcon[l.status] || statusIcon.Aguardando;
    const capa = l.coverUrl
      ? `<img src="${l.coverUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'">`
      : `<div style="width:100%;height:100%;background:var(--bg3);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">📚</div>`;
    const livroEsc = l.livro.replace(/'/g,"\\'");
    return `
    <div title="${l.livro}" onclick="fecharPainelMeta();abrirLivroDetalhes('${livroEsc}')"
      style="position:relative;width:84px;flex-shrink:0;cursor:pointer;transition:transform .2s;z-index:1;"
      onmouseenter="this.style.transform='scale(1.5)';this.style.zIndex='10'"
      onmouseleave="this.style.transform='scale(1)';this.style.zIndex='1'">
      <div style="width:84px;height:120px;position:relative;border-radius:6px;overflow:hidden;box-shadow:2px 4px 12px rgba(0,0,0,0.5);">
        ${capa}
      </div>
      <div style="position:absolute;bottom:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;font-size:13px;" title="${l.status}">${st.icon}</div>
      <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.livro.slice(0,16)}</div>
    </div>`;
  }).join('');

  painel.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
}
window.abrirPainelMeta = abrirPainelMeta;

function fecharPainelMeta() {
  document.getElementById('painelMeta').style.display = 'none';
  document.getElementById('painelMetaOverlay').style.display = 'none';
}

// ════════════════════════════════════════════════
// GERENCIAR META — selecionar livros para a meta de um ano
// ════════════════════════════════════════════════
let gmSelecionados = new Set(); // livros marcados (vivem fora da renderização p/ persistir com filtros)
let gmAnoAtual = null;
let gmMostrarOutrasMetas = false; // mostra livros que já têm metaAno de outro ano

function atualizarBtnOutrasMetas() {
  const btn = document.getElementById('gmToggleOutrasMetas');
  if (!btn) return;
  if (gmMostrarOutrasMetas) {
    btn.textContent = '☑ Considerar livros que já tenham meta';
    btn.style.color = 'var(--purple)';
    btn.style.borderColor = 'var(--purple)';
  } else {
    btn.textContent = '☐ Considerar livros que já tenham meta';
    btn.style.color = 'var(--muted)';
    btn.style.borderColor = 'var(--border)';
  }
}
window.atualizarBtnOutrasMetas = atualizarBtnOutrasMetas;

function abrirGerenciarMeta() {
  const ano = document.getElementById('selMetaAno')?.value || '2026';
  gmAnoAtual = ano;
  gmSelecionados = new Set();

  // Pré-marca livros que já têm metaAno === ano
  (window._livros || []).forEach(l => {
    if (String(l.metaAno) === String(ano)) gmSelecionados.add(l.livro);
  });

  // Popula filtro de coleção — exclui coleções 100% completas
  const colSel = document.getElementById('gmFiltroColecao');
  const colecoesComPendentes = new Set(
    (window._livros||[])
      .filter(l => l.colecao && String(l.status||'').trim().toLowerCase() !== 'completo')
      .map(l => l.colecao)
  );
  const cols = [...colecoesComPendentes].sort();
  colSel.innerHTML = '<option value="all">Todas as coleções</option>' + cols.map(c=>`<option value="${c.replace(/"/g,'&quot;')}">${c}</option>`).join('');
  colSel.value = 'all';
  document.getElementById('gmOrdem').value = 'az';
  gmMostrarOutrasMetas = false;
  atualizarBtnOutrasMetas();
  const gmBuscaEl = document.getElementById('gmBusca');
  if (gmBuscaEl) gmBuscaEl.value = '';

  document.getElementById('gmTitulo').textContent = gmSelecionados.size > 0
    ? `⚙️ Gerenciar Meta ${ano} (já possui livros)`
    : `⚙️ Definir Meta ${ano} (meta vazia)`;

  document.getElementById('gmMsg').className = 'pwa-msg';
  document.getElementById('gmMsg').textContent = '';

  renderGerenciarMeta();
  document.getElementById('painelGerenciarMeta').style.display = 'flex';
  document.getElementById('painelGerenciarMetaOverlay').style.display = 'block';
}
window.abrirGerenciarMeta = abrirGerenciarMeta;

function fecharGerenciarMeta() {
  document.getElementById('painelGerenciarMeta').style.display = 'none';
  document.getElementById('painelGerenciarMetaOverlay').style.display = 'none';
}
window.fecharGerenciarMeta = fecharGerenciarMeta;

function renderGerenciarMeta() {
  const colFiltro = document.getElementById('gmFiltroColecao').value;
  const ordem = document.getElementById('gmOrdem').value;
  const busca = (document.getElementById('gmBusca')?.value || '').toLowerCase().trim();

  let pool = (window._livros || []).filter(l => String(l.status||'').trim().toLowerCase() !== 'completo');

  // Livros que já têm metaAno definido para OUTRO ano: ocultos por padrão
  if (!gmMostrarOutrasMetas) {
    pool = pool.filter(l => {
      const ma = String(l.metaAno || '');
      const semMeta = !ma || ma === 'AINDA NÃO DEFINIDO';
      return semMeta || ma === String(gmAnoAtual) || gmSelecionados.has(l.livro);
    });
  }

  if (colFiltro !== 'all') pool = pool.filter(l => l.colecao === colFiltro);
  if (busca) pool = pool.filter(l => l.livro.toLowerCase().includes(busca));

  if (ordem === 'az') {
    pool = [...pool].sort((a,b) => a.livro.localeCompare(b.livro));
  } else { // colecao
    pool = [...pool].sort((a,b) => {
      const ca = a.colecao || 'zzz', cb = b.colecao || 'zzz';
      if (ca !== cb) return ca.localeCompare(cb);
      const oa = parseFloat(a.ordemColecao || a.ordem) || 999;
      const ob = parseFloat(b.ordemColecao || b.ordem) || 999;
      if (oa !== ob) return oa - ob;
      return a.livro.localeCompare(b.livro);
    });
  }

  // Selecionados sempre primeiro (mantém ordem relativa entre eles)
  pool = [...pool].sort((a,b) => {
    const selA = gmSelecionados.has(a.livro) ? 0 : 1;
    const selB = gmSelecionados.has(b.livro) ? 0 : 1;
    return selA - selB;
  });

  const lista = document.getElementById('gmLista');
  lista.innerHTML = pool.map(l => {
    const checked = gmSelecionados.has(l.livro);
    const capa = l.coverUrl
      ? `<img src="${l.coverUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'">`
      : `<div style="width:100%;height:100%;background:var(--bg3);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">📚</div>`;
    const livroEsc = l.livro.replace(/'/g,"\\'");
    const statusBadge = l.status === 'Completo'
      ? `<div style="position:absolute;top:4px;left:4px;background:rgba(34,197,94,0.85);border-radius:4px;font-size:9px;padding:1px 4px;color:#fff;">✅</div>`
      : '';
    const outraMeta = l.metaAno && l.metaAno !== 'AINDA NÃO DEFINIDO' && String(l.metaAno) !== String(gmAnoAtual);
    const metaBadge = outraMeta
      ? `<div style="position:absolute;top:4px;right:4px;background:rgba(249,115,22,0.9);border-radius:4px;font-size:9px;padding:1px 5px;color:#fff;font-weight:700;">🎯 ${l.metaAno}</div>`
      : '';
    return `
    <div onclick="toggleGmLivro('${livroEsc}')" title="${l.livro}"
      style="position:relative;width:84px!important;max-width:84px!important;min-width:84px;flex:0 0 84px!important;flex-shrink:0;flex-grow:0;cursor:pointer;box-sizing:border-box;transition:transform .2s;transform-origin:center;z-index:1;background:var(--bg2);border-radius:8px;padding:4px;"
      onmouseenter="this.style.transform='scale(2)';this.style.zIndex='50';this.style.boxShadow='0 8px 32px rgba(0,0,0,0.9)'"
      onmouseleave="this.style.transform='scale(1)';this.style.zIndex='1';this.style.boxShadow='none'">
      <div style="width:84px!important;height:120px!important;max-width:84px;max-height:120px;position:relative;border-radius:6px;overflow:hidden;box-shadow:2px 4px 12px rgba(0,0,0,0.5);box-sizing:border-box;${checked?'outline:3px solid var(--purple);outline-offset:2px;':''}">
        ${capa}
        ${statusBadge}
        ${metaBadge}
        ${checked ? `<div style="position:absolute;inset:0;background:rgba(139,124,248,0.25);display:flex;align-items:center;justify-content:center;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">✓</div>
        </div>` : ''}
      </div>
      <div style="font-size:12px;line-height:1.3;color:${checked?'var(--purple)':'var(--text)'};text-align:center;margin-top:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-weight:${checked?'700':'500'};">${l.livro}</div>
    </div>`;
  }).join('');

  if (!pool.length) {
    lista.innerHTML = '<div style="color:var(--muted);text-align:center;padding:30px;width:100%;">Nenhum livro encontrado para este filtro.</div>';
  }

  document.getElementById('gmContador').textContent = `${gmSelecionados.size} livro(s) selecionado(s) para a meta ${gmAnoAtual} · ${pool.length} exibido(s) neste filtro`;
}
window.renderGerenciarMeta = renderGerenciarMeta;

function toggleGmLivro(livro) {
  if (gmSelecionados.has(livro)) gmSelecionados.delete(livro);
  else gmSelecionados.add(livro);
  renderGerenciarMeta();
}
window.toggleGmLivro = toggleGmLivro;

async function salvarGerenciarMeta() {
  const btn = document.getElementById('gmBtnSalvar');
  const ano = gmAnoAtual;

  // Livros que tinham metaAno === ano e agora não devem mais ter (foram desmarcados)
  const tinhaMeta = new Set();
  (window._livros || []).forEach(l => {
    if (String(l.metaAno) === String(ano)) tinhaMeta.add(l.livro);
  });

  const adicionar = [...gmSelecionados].filter(l => !tinhaMeta.has(l));
  const remover    = [...tinhaMeta].filter(l => !gmSelecionados.has(l));

  if (!adicionar.length && !remover.length) {
    fecharGerenciarMeta();
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ acao: 'definirMetaLote', ano, adicionar, remover })
    });
    const d = await r.json();
    if (d.ok) {
      mostrarMsg('gmMsg', '✅ ' + d.msg, 'ok');
      // Atualiza localmente para refletir na hora, sem esperar o recarregamento remoto
      (window._livros || []).forEach(l => {
        if (adicionar.includes(l.livro)) l.metaAno = ano;
        else if (remover.includes(l.livro)) l.metaAno = '';
      });
      if (window._dadosD && window._sessoes) {
        // Sincroniza metaAno também nos arrays brutos usados por recalcularDados
        ['livros','lendo','pausados','aguardando'].forEach(k => {
          (window._dadosD[k]||[]).forEach(l => {
            if (adicionar.includes(l.livro)) l.metaAno = ano;
            else if (remover.includes(l.livro)) l.metaAno = '';
          });
        });
        recalcularDados(window._dadosD, window._sessoes);
      }
      recarregarAteAtualizar((window._dadosD?.sessoes||[]).length).catch(()=>{});
      setTimeout(() => fecharGerenciarMeta(), 1200);
    } else {
      mostrarMsg('gmMsg', '❌ ' + d.erro, 'err');
    }
  } catch(e) {
    // A escrita pode ter sido aplicada mesmo com erro de resposta (timeout do Apps Script).
    // Aplica localmente, avisa o usuário e confirma com o servidor (com timeout de segurança).
    mostrarMsg('gmMsg', '⚠️ Sem confirmação do servidor — verificando se foi salvo...', 'err');
    (window._livros || []).forEach(l => {
      if (adicionar.includes(l.livro)) l.metaAno = ano;
      else if (remover.includes(l.livro)) l.metaAno = '';
    });
    if (window._dadosD && window._sessoes) {
      ['livros','lendo','pausados','aguardando'].forEach(k => {
        (window._dadosD[k]||[]).forEach(l => {
          if (adicionar.includes(l.livro)) l.metaAno = ano;
          else if (remover.includes(l.livro)) l.metaAno = '';
        });
      });
      recalcularDados(window._dadosD, window._sessoes);
    }
    let confirmado = false;
    try {
      confirmado = await Promise.race([
        (async () => {
          const todosAlvo = [...adicionar, ...remover];
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 1000));
            try {
              const r = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ acao: 'consultarMetaAnos', livros: todosAlvo })
              });
              const d = await r.json();
              if (!d.ok) continue;
              const ok = adicionar.every(nome => String(d.metas[nome]) === String(ano))
                      && remover.every(nome => String(d.metas[nome]) !== String(ano));
              if (ok) return true;
            } catch(e) {}
          }
          return false;
        })(),
        new Promise(resolve => setTimeout(() => resolve(false), 15000)) // timeout de segurança
      ]);
    } catch(e2) {
      confirmado = false;
    }
    if (confirmado) {
      mostrarMsg('gmMsg', '✅ Confirmado: meta salva com sucesso!', 'ok');
      recarregarAteAtualizar((window._dadosD?.sessoes||[]).length).catch(()=>{});
      setTimeout(() => fecharGerenciarMeta(), 1000);
    } else {
      mostrarMsg('gmMsg', '⚠️ Alteração aplicada localmente, mas sem confirmação do servidor. Você pode continuar editando ou recarregar a página depois para conferir.', 'err');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ Salvar Meta';
  }
}
window.salvarGerenciarMeta = salvarGerenciarMeta;
function fecharPainel() {
  // Fecha qualquer painel overlay aberto
  ['painelStatus','painelGenero','painelMetaOverlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  ['painelGeneroOverlay','painelMetaOverlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
window.fecharPainel = fecharPainel;

function abrirLivroDetalhes(livro) {
  // selBook é hidden, selBookBusca é o campo de texto
  const hidden = document.getElementById('selBook');
  const busca  = document.getElementById('selBookBusca');
  if (!hidden || !busca) return;
  hidden.value = livro;
  busca.value  = livro;
  if (window.buildBookChart) window.buildBookChart();
  if (window.buildBookInfo)  window.buildBookInfo();
  // Scroll até a seção de detalhes
  const card = busca.closest('.card') || document.getElementById('selBookBusca')?.closest('[class]');
  if (card) card.scrollIntoView({ behavior:'smooth', block:'center' });
}
window.abrirLivroDetalhes = abrirLivroDetalhes;


// ════════════════════════════════════════════════
// BOOKLEGACY V7.2 — FIREBASE ESTÁVEL + AMIGOS + PWA
// Mantém o layout original e troca data.json por Firestore.
// ════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "%VITE_FIREBASE_API_KEY%",
  authDomain: "%VITE_FIREBASE_AUTH_DOMAIN%",
  projectId: "%VITE_FIREBASE_PROJECT_ID%",
  storageBucket: "%VITE_FIREBASE_STORAGE_BUCKET%",
  messagingSenderId: "%VITE_FIREBASE_MESSAGING_SENDER_ID%",
  appId: "%VITE_FIREBASE_APP_ID%"
};

window.BL = window.BL || {};
function blShowFatalConfigError(msg){
  const loading = document.getElementById('loading');
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'none';
  if (loading) {
    loading.style.display = 'block';
    loading.innerHTML = '<div style="max-width:720px;margin:30px auto;background:#161b27;border:1px solid #f88c6a;border-radius:16px;padding:24px;color:#e2e8f0;text-align:left"><h2 style="color:#f88c6a;margin-bottom:10px">⚠️ Configuração do Firebase não carregou</h2><p>'+msg+'</p><p style="color:#8892a8;margin-top:10px">Verifique as variáveis VITE_FIREBASE_* na Vercel e faça Redeploy.</p></div>';
  }
}
if (Object.values(firebaseConfig).some(v => !v || String(v).includes('%VITE_'))) {
  blShowFatalConfigError('As variáveis do Firebase não foram substituídas no build. Isso causa carregamento infinito.');
  throw new Error('Firebase config não substituído no build');
}
window.BL.app = firebase.initializeApp(firebaseConfig);
window.BL.auth = firebase.auth();
window.BL.provider = new firebase.auth.GoogleAuthProvider();
window.BL.db = firebase.firestore();
try {
  // Evita travar em alguns navegadores/rede quando o Firestore tenta usar stream/websocket.
  window.BL.db.settings({ experimentalAutoDetectLongPolling: true, merge: true });
} catch(e) { console.warn('Firestore settings já aplicadas', e); }

function blNum(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
function blTxt(v){ return String(v ?? '').trim(); }
function blSlug(str){ return blTxt(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,90) || ('item-'+Date.now()); }
function blStatus(v){ return blTxt(v).toLowerCase(); }
function blIsDone(v){ return ['completo','lido','finalizado','concluido','concluído'].includes(blStatus(v)); }
function blIsReading(v){ return ['lendo','em leitura'].includes(blStatus(v)); }
function blIsPaused(v){ return ['pausado','pausados'].includes(blStatus(v)); }
function blIsWaiting(v){ return ['aguardando','pendente','planejado','planejada'].includes(blStatus(v)); }

function blNormalizeText(v){
  return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9@._ -]/g,' ').replace(/\s+/g,' ').trim();
}

function blSearchTermsFromProfile(user){
  const name = blNormalizeText(user.displayName || '');
  const email = blNormalizeText(user.email || '');
  const parts = [...name.split(' '), ...email.split(/[.@_ -]/), user.uid].filter(Boolean);
  return Array.from(new Set(parts.filter(t => t.length >= 2).slice(0, 30)));
}

async function blEnsureUserProfile(user){
  const ref = window.BL.db.collection('users').doc(user.uid);
  const snap = await ref.get();
  const now = new Date().toISOString();
  const data = { uid:user.uid, name:user.displayName||'', email:user.email||'', photoURL:user.photoURL||'', role:'user', plan:'free', updatedAt:now };
  if (!snap.exists) data.createdAt = now;
  await ref.set(data, { merge:true });
  await window.BL.db.collection('publicProfiles').doc(user.uid).set({
    uid:user.uid,
    displayName:user.displayName || (user.email || 'Usuário').split('@')[0],
    email:user.email || '',
    photoURL:user.photoURL || '',
    searchName: blNormalizeText((user.displayName || '') + ' ' + (user.email || '')),
    searchTerms: blSearchTermsFromProfile(user),
    updatedAt: now
  }, { merge:true });
}

function blMapSnap(snap){ return snap.docs.map(d => ({ id:d.id, ...d.data() })); }

function blProfileLabel(user){
  const src = `${user.displayName || ''} ${user.email || ''}`.toLowerCase();
  if (src.includes('daniel')) return 'Daniel';
  if (src.includes('milton')) return 'Milton';
  return (user.displayName || user.email || 'Usuário').split(' ')[0];
}


function blWithTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo excedido ao carregar: ' + label)), ms))
  ]);
}

async function blSafeGet(query, label){
  try { return await blWithTimeout(query.get(), 14000, label); }
  catch(e){ console.error('Falha ao ler', label, e); throw e; }
}

async function blReadUserBundle(uid, label){
  const userRef = window.BL.db.collection('users').doc(uid);
  const [librarySnap, sessionsSnap, ratingsSnap, goalsSnap, collectionsSnap] = await Promise.all([
    blSafeGet(userRef.collection('library'), 'library/' + label),
    blSafeGet(userRef.collection('sessions'), 'sessions/' + label),
    blSafeGet(userRef.collection('ratings'), 'ratings/' + label),
    blSafeGet(userRef.collection('goals'), 'goals/' + label),
    blSafeGet(userRef.collection('collections'), 'collections/' + label),
  ]);
  return {
    uid, label,
    library: blMapSnap(librarySnap),
    sessions: blMapSnap(sessionsSnap),
    ratings: blMapSnap(ratingsSnap),
    goals: blMapSnap(goalsSnap),
    collections: blMapSnap(collectionsSnap)
  };
}

async function blLoadFriendsForUser(uid){
  try {
    const snap = await blSafeGet(window.BL.db.collection('users').doc(uid).collection('friends').where('status','==','accepted'), 'friends');
    return snap.docs.map(d => ({ uid:d.id, ...(d.data()||{}) }));
  } catch(e) {
    console.warn('Amigos não carregados. Verifique regras do Firestore.', e);
    return [];
  }
}

async function blLoadFirestoreData(){
  const user = window.BL.auth.currentUser;
  if (!user) throw new Error('Usuário não logado');
  const uid = user.uid;
  const meLabel = blProfileLabel(user);

  // Primeiro carrega o usuário logado. Assim o dashboard abre mesmo se amigos/livros globais falharem.
  const myBundle = await blReadUserBundle(uid, meLabel);

  let books = [];
  try {
    const booksSnap = await blSafeGet(window.BL.db.collection('books'), 'books');
    books = blMapSnap(booksSnap);
  } catch(e) {
    console.warn('Coleção books não carregou; seguindo com dados da library.', e);
  }

  let friends = [];
  let friendBundles = [];
  try {
    friends = await blLoadFriendsForUser(uid);
    for (const f of friends) {
      const label = f.displayName || f.name || f.label || (f.email||'Amigo').split('@')[0] || 'Amigo';
      try { friendBundles.push(await blReadUserBundle(f.uid, label)); }
      catch(e){ console.warn('Não foi possível ler amigo', f.uid, e); }
    }
  } catch(e) {
    console.warn('Amigos não carregados; dashboard individual será exibido.', e);
  }

  const raw = { uid, currentLabel:meLabel, books, users:[myBundle, ...friendBundles], friends };
  window.BL.raw = raw;
  blUpdateUserButtons(raw);
  return blAdaptFirestoreToLegacy(raw);
}

function blUpdateUserButtons(raw){
  const btnMilton = document.getElementById('btn-user-milton');
  const btnDaniel = document.getElementById('btn-user-daniel');
  const btnBatalha = document.getElementById('btn-user-batalha');
  const labels = (raw.users||[]).map(u => u.label);
  if (btnMilton) {
    btnMilton.textContent = `📖 ${raw.currentLabel || 'Meus dados'}`;
    btnMilton.setAttribute('onclick', 'setUsuario(' + JSON.stringify(raw.currentLabel || 'Milton') + ')');
  }
  const hasDaniel = labels.some(l => String(l).toLowerCase() === 'daniel');
  if (btnDaniel) btnDaniel.style.display = hasDaniel ? '' : 'none';
  if (btnBatalha) btnBatalha.style.display = (raw.users||[]).length >= 2 ? '' : 'none';
}

function blLegacyBook(item, bookMap, userLabel){
  const b = bookMap.get(item.bookId) || {};
  const title = blTxt(item.title || b.title || item.livro || b.livro);
  const total = blNum(item.totalPages || item.pages || b.pages || b.totalPages);
  const current = blNum(item.currentPage || item.pagAtual || (blIsDone(item.status) ? total : 0));
  return {
    id: item.id,
    bookId: item.bookId || b.id || '',
    livro: title,
    autor: blTxt(item.author || b.author || item.autor),
    isbn: blTxt(item.isbn || b.isbn),
    coverUrl: blTxt(item.coverUrl || b.coverUrl || item.capa || b.capa),
    metaAno: blTxt(item.targetYear || item.metaAno || item.year),
    anoConclusao: blTxt(item.completionYear || item.anoConclusao),
    depende: blTxt(item.dependency || item.depende),
    colecao: blTxt(item.collection || b.collection || item.colecao),
    ordemColecao: blNum(item.collectionOrder || item.ordemColecao),
    ordem: blNum(item.order || item.ordem),
    status: blTxt(item.status || 'Aguardando'),
    totalPag: total,
    pagAtual: current,
    pct: total ? Math.min(1, Math.max(0, current / total)) : blNum(item.progress),
    usuario: userLabel || 'Milton',
    genero: blTxt(item.genre || b.genre || item.genero)
  };
}

function blAdaptFirestoreToLegacy(raw){
  const bookMap = new Map((raw.books || []).map(b => [b.id, b]));
  const bundles = raw.users || [{ label: raw.currentLabel || 'Milton', library: raw.library||[], sessions: raw.sessions||[], ratings: raw.ratings||[], goals: raw.goals||[], collections: raw.collections||[] }];
  const legacyBooks = bundles.flatMap(u => (u.library || []).map(item => blLegacyBook(item, bookMap, u.label))).filter(l => l.livro);
  const sessoes = bundles.flatMap(u => (u.sessions || []).map(s => ({
    id: s.id,
    bookId: s.bookId || '',
    livro: blTxt(s.title || s.livro),
    colecao: blTxt(s.collection || s.colecao),
    data: blTxt(s.date || s.data),
    paginas: blNum(s.pages || s.paginas),
    minutos: blNum(s.minutes || s.minutos),
    segundos: blNum(s.seconds || s.segundos),
    ano: blNum(s.year || s.ano || String(s.date||'').slice(0,4)),
    usuario: u.label || 'Milton'
  }))).filter(s => s.livro && s.data);
  const notas = bundles.flatMap(u => (u.ratings || []).map(r => {
    const criterios = {
      'Diálogos': blNum(r.dialogos), 'Enredo': blNum(r.enredo), 'Estilo Visual': blNum(r.estiloVisual),
      'Finalização': blNum(r.finalizacao), 'Imersão': blNum(r.imersao), 'Impacto Emocional': blNum(r.impactoEmocional),
      'Originalidade': blNum(r.originalidade), 'Personagens': blNum(r.personagens), 'Ritmo': blNum(r.ritmo), 'Temas': blNum(r.temas)
    };
    const vals = Object.values(criterios).filter(v => v > 0);
    const media = blNum(r.notaFinal || r.notaPonderada) || (vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0);
    return { id:r.id, bookId:r.bookId||'', livro:blTxt(r.title || r.livro), ano:blNum(r.readingYear || r.ano), media, criterios, usuario:u.label || 'Milton' };
  })).filter(n => n.livro);
  const metasPorAno = {};
  const ownBundle = bundles[0] || {goals:[]};
  (ownBundle.goals || []).forEach(g => {
    const y = String(g.year || g.id || '').replace(/[^0-9]/g,'') || String(g.year || '');
    if (!y) return;
    if (g.raw) metasPorAno[y] = g.raw;
    else {
      const livrosAno = legacyBooks.filter(l => String(l.metaAno) === y || String(l.anoConclusao) === y);
      const lidos = livrosAno.filter(l => blIsDone(l.status)).length;
      const lendo = livrosAno.filter(l => blIsReading(l.status)).length;
      const pausados = livrosAno.filter(l => blIsPaused(l.status)).length;
      const aguardando = livrosAno.filter(l => blIsWaiting(l.status)).length;
      const paginasTotal = livrosAno.reduce((a,l)=>a+blNum(l.totalPag),0);
      const paginasLidas = livrosAno.reduce((a,l)=>a+blNum(l.pagAtual),0);
      metasPorAno[y] = { total: blNum(g.booksGoal)||livrosAno.length, lidos, lendo, pausados, aguardando, paginasTotal: blNum(g.pagesGoal)||paginasTotal, paginasLidas, paginasFaltando: Math.max(0,(blNum(g.pagesGoal)||paginasTotal)-paginasLidas), faltando: Math.max(0,(blNum(g.booksGoal)||livrosAno.length)-lidos), mediaDiaria:0, ritmoAtual:0, dataPrevistoAtual:'—' };
    }
  });
  const anoAtual = metasPorAno['2026'] ? '2026' : (Object.keys(metasPorAno).sort().pop() || String(new Date().getFullYear()));
  const metaAtual = metasPorAno[anoAtual] || {};
  return {
    geradoEm: new Date().toISOString(),
    meta: metaAtual,
    metasPorAno,
    sessoes,
    livros: legacyBooks,
    lendo: legacyBooks.filter(l => blIsReading(l.status)),
    pausados: legacyBooks.filter(l => blIsPaused(l.status)),
    aguardando: legacyBooks.filter(l => blIsWaiting(l.status)),
    notas
  };
}

async function blRefreshAndRender(){
  const d = await blLoadFirestoreData();
  window._dadosD = d;
  if (typeof inicializar === 'function' && !window.__BL_INITIALIZED) {
    window.__BL_INITIALIZED = true;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    inicializar(d);
  } else if (typeof setUsuario === 'function') {
    window._dadosD = d;
    setUsuario((window.BL.raw && window.BL.raw.currentLabel) || 'Milton');
  }
  const footer = document.getElementById('footer-data');
  if (footer) footer.textContent = new Date().toLocaleString('pt-BR');
}


function blGetInviteFromUrl(){
  const url = new URL(window.location.href);
  const invite = url.searchParams.get('invite') || url.hash.match(/invite=([^&]+)/)?.[1] || '';
  const name = url.searchParams.get('name') || url.hash.match(/name=([^&]+)/)?.[1] || '';
  return { inviteUid: decodeURIComponent(invite || ''), inviteName: decodeURIComponent(name || '') };
}

async function blAcceptInviteIfPresent(user){
  const { inviteUid, inviteName } = blGetInviteFromUrl();
  if (!inviteUid || inviteUid === user.uid) return;
  const now = new Date().toISOString();
  const myName = user.displayName || user.email || 'Amigo';
  const inviterName = inviteName || 'Amigo';
  const batch = window.BL.db.batch();
  const myFriendRef = window.BL.db.collection('users').doc(user.uid).collection('friends').doc(inviteUid);
  const inviterFriendRef = window.BL.db.collection('users').doc(inviteUid).collection('friends').doc(user.uid);
  batch.set(myFriendRef, { uid: inviteUid, displayName: inviterName, status: 'accepted', acceptedAt: now, source: 'invite_link' }, { merge: true });
  batch.set(inviterFriendRef, { uid: user.uid, displayName: myName, email: user.email || '', photoURL: user.photoURL || '', status: 'accepted', acceptedAt: now, source: 'invite_link' }, { merge: true });
  await batch.commit();
  const clean = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, clean);
  alert('✅ Amizade criada! Agora o Modo Batalha aparece para vocês dois.');
}


const BL_DANIEL_UID = 'E6gcZlwzNTMPxmTTINCdSlmR8I63';

function blFriendLabel(f){
  return f.displayName || f.name || f.label || (f.email || '').split('@')[0] || f.uid || 'Amigo';
}

async function blAddAcceptedFriend(friend){
  const me = window.BL.auth.currentUser;
  if (!me) throw new Error('Faça login primeiro.');
  if (!friend || !friend.uid) throw new Error('Amigo inválido.');
  if (friend.uid === me.uid) throw new Error('Você não pode adicionar você mesmo.');
  const now = new Date().toISOString();
  const myProfile = { uid: me.uid, displayName: me.displayName || (me.email||'').split('@')[0] || 'Usuário', email: me.email || '', photoURL: me.photoURL || '', status:'accepted', acceptedAt: now, source:'community' };
  const friendProfile = { uid: friend.uid, displayName: friend.displayName || friend.name || friend.email || 'Amigo', email: friend.email || '', photoURL: friend.photoURL || '', status:'accepted', acceptedAt: now, source:'community' };
  const batch = window.BL.db.batch();
  batch.set(window.BL.db.collection('users').doc(me.uid).collection('friends').doc(friend.uid), friendProfile, { merge:true });
  batch.set(window.BL.db.collection('users').doc(friend.uid).collection('friends').doc(me.uid), myProfile, { merge:true });
  await batch.commit();
  await blRefreshAndRender();
  return true;
}

async function blLoadCommunityFriends(){
  const me = window.BL.auth.currentUser;
  if (!me) return [];
  const snap = await blSafeGet(window.BL.db.collection('users').doc(me.uid).collection('friends'), 'community friends');
  return snap.docs.map(d => ({ uid:d.id, ...(d.data()||{}) }));
}

async function blSearchCommunityUsers(q){
  const me = window.BL.auth.currentUser;
  const term = blNormalizeText(q).split(' ')[0];
  if (!term || term.length < 2) return [];
  let snap;
  if (q.length > 20 && !q.includes(' ')) {
    const doc = await window.BL.db.collection('publicProfiles').doc(q.trim()).get();
    return doc.exists ? [{ id:doc.id, ...doc.data() }].filter(p => p.uid !== me.uid) : [];
  }
  snap = await blSafeGet(window.BL.db.collection('publicProfiles').where('searchTerms','array-contains', term).limit(12), 'public profile search');
  return snap.docs.map(d => ({ id:d.id, ...d.data() })).filter(p => p.uid !== me.uid);
}

function blCommunityShell(){
  const existing = document.getElementById('blCommunityModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'blCommunityModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.76);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  modal.innerHTML = `<div style="width:min(920px,100%);max-height:92vh;overflow:auto;background:#161b27;border:1px solid #2a3248;border-radius:18px;padding:22px;color:#e2e8f0;box-shadow:0 20px 70px rgba(0,0,0,.55)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px">
      <div><h2 style="margin:0 0 4px">👥 Comunidade</h2><p style="color:#8892a8;margin:0;line-height:1.45">Veja seus amigos, pesquise usuários e convide alguém para o app.</p></div>
      <button id="blCommunityClose" style="border:1px solid #2a3248;border-radius:10px;background:#1e2535;color:#e2e8f0;padding:9px 12px;cursor:pointer">Fechar</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="bl-community-grid">
      <section style="background:#0d1117;border:1px solid #2a3248;border-radius:14px;padding:16px">
        <h3 style="margin:0 0 10px">🤝 Meus amigos</h3>
        <div id="blFriendsList" style="display:flex;flex-direction:column;gap:10px;color:#8892a8">Carregando...</div>
      </section>
      <section style="background:#0d1117;border:1px solid #2a3248;border-radius:14px;padding:16px">
        <h3 style="margin:0 0 10px">🔎 Adicionar amigo</h3>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input id="blFriendSearchInput" placeholder="Digite nome, e-mail ou UID" style="flex:1;padding:11px;border-radius:10px;border:1px solid #2a3248;background:#161b27;color:#e2e8f0">
          <button id="blFriendSearchBtn" style="border:none;border-radius:10px;background:#8b7cf8;color:white;font-weight:800;padding:10px 14px;cursor:pointer">Buscar</button>
        </div>
        <button id="blAddDanielQuick" style="width:100%;border:1px solid #8b7cf8;border-radius:10px;background:rgba(139,124,248,.13);color:#e2e8f0;font-weight:800;padding:10px 14px;cursor:pointer;margin-bottom:10px">Adicionar Daniel pelo UID já informado</button>
        <div id="blFriendSearchResults" style="display:flex;flex-direction:column;gap:10px;color:#8892a8">Pesquise por nome depois que a pessoa entrar uma vez no app.</div>
      </section>
    </div>
    <section style="margin-top:16px;background:#0d1117;border:1px solid #2a3248;border-radius:14px;padding:16px">
      <h3 style="margin:0 0 10px">🔗 Link de convite</h3>
      <p style="color:#8892a8;margin:0 0 10px;line-height:1.45">Envie para alguém. Quando a pessoa abrir e entrar com Google, a amizade é criada automaticamente.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="blInviteInputCommunity" readonly style="flex:1;min-width:240px;padding:11px;border-radius:10px;border:1px solid #2a3248;background:#161b27;color:#e2e8f0"><button id="blInviteCopyCommunity" style="border:none;border-radius:10px;background:#4ecdc4;color:#0d1117;font-weight:900;padding:10px 14px;cursor:pointer">Copiar convite</button></div>
    </section>
  </div>`;
  document.body.appendChild(modal);
  const st = document.createElement('style');
  st.textContent = '@media(max-width:800px){.bl-community-grid{grid-template-columns:1fr!important}#blCommunityModal{align-items:flex-start!important;padding:10px!important}}';
  modal.appendChild(st);
  document.getElementById('blCommunityClose').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  return modal;
}

function blRenderFriendRow(f){
  const img = f.photoURL ? `<img src="${String(f.photoURL).replace(/"/g,'&quot;')}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">` : '<div style="width:36px;height:36px;border-radius:50%;background:#252d40;display:flex;align-items:center;justify-content:center">👤</div>';
  return `<div style="display:flex;align-items:center;gap:10px;background:#161b27;border:1px solid #2a3248;border-radius:12px;padding:10px">${img}<div style="flex:1;min-width:0"><div style="font-weight:800;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${blFriendLabel(f)}</div><div style="font-size:12px;color:#8892a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.email || f.uid || ''}</div></div><span style="font-size:12px;color:#4ecdc4;font-weight:800">${f.status || 'accepted'}</span></div>`;
}

function blRenderSearchResult(p){
  const safe = (v) => String(v||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const img = p.photoURL ? `<img src="${safe(p.photoURL)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">` : '<div style="width:36px;height:36px;border-radius:50%;background:#252d40;display:flex;align-items:center;justify-content:center">👤</div>';
  return `<div style="display:flex;align-items:center;gap:10px;background:#161b27;border:1px solid #2a3248;border-radius:12px;padding:10px">${img}<div style="flex:1;min-width:0"><div style="font-weight:800;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${safe(p.displayName || p.name || p.email || 'Usuário')}</div><div style="font-size:12px;color:#8892a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${safe(p.email || p.uid || '')}</div></div><button data-add-friend="${safe(p.uid)}" style="border:none;border-radius:9px;background:#8b7cf8;color:white;font-weight:800;padding:8px 12px;cursor:pointer">Adicionar</button></div>`;
}

async function blOpenCommunityModal(){
  const user = window.BL && window.BL.auth && window.BL.auth.currentUser;
  if (!user) return alert('Entre com Google primeiro.');
  blCommunityShell();
  const invite = blCreateInviteLink(user);
  document.getElementById('blInviteInputCommunity').value = invite;
  document.getElementById('blInviteCopyCommunity').onclick = async () => {
    const ok = await blCopyText(invite);
    document.getElementById('blInviteCopyCommunity').textContent = ok ? '✅ Copiado' : 'Copie manualmente';
  };
  async function refreshFriends(){
    const box = document.getElementById('blFriendsList');
    try {
      const friends = await blLoadCommunityFriends();
      box.innerHTML = friends.length ? friends.map(blRenderFriendRow).join('') : '<p style="margin:0;color:#8892a8">Você ainda não tem amigos adicionados.</p>';
    } catch(e){ box.innerHTML = '<p style="color:#f88c6a">Erro ao carregar amigos: '+e.message+'</p>'; }
  }
  await refreshFriends();
  document.getElementById('blAddDanielQuick').onclick = async () => {
    const btn = document.getElementById('blAddDanielQuick');
    btn.disabled = true; btn.textContent = 'Adicionando Daniel...';
    try {
      let prof = { uid: BL_DANIEL_UID, displayName:'Daniel', email:'', photoURL:'' };
      try { const doc = await window.BL.db.collection('publicProfiles').doc(BL_DANIEL_UID).get(); if (doc.exists) prof = { uid:BL_DANIEL_UID, ...doc.data() }; } catch(e) {}
      await blAddAcceptedFriend(prof);
      btn.textContent = '✅ Daniel adicionado';
      await refreshFriends();
    } catch(e){ btn.disabled = false; btn.textContent = 'Erro: '+e.message; }
  };
  document.getElementById('blFriendSearchBtn').onclick = async () => {
    const q = document.getElementById('blFriendSearchInput').value.trim();
    const res = document.getElementById('blFriendSearchResults');
    res.innerHTML = 'Buscando...';
    try {
      const users = await blSearchCommunityUsers(q);
      res.innerHTML = users.length ? users.map(blRenderSearchResult).join('') : 'Nenhum usuário encontrado. A pessoa precisa ter entrado no app pelo menos uma vez.';
      res.querySelectorAll('[data-add-friend]').forEach(btn => {
        btn.onclick = async () => {
          const uid = btn.getAttribute('data-add-friend');
          const p = users.find(u => u.uid === uid);
          btn.disabled = true; btn.textContent = 'Adicionando...';
          try { await blAddAcceptedFriend(p); btn.textContent = '✅ Adicionado'; await refreshFriends(); }
          catch(e){ btn.disabled = false; btn.textContent = 'Erro'; alert(e.message); }
        };
      });
    } catch(e){ res.innerHTML = '<span style="color:#f88c6a">Erro na busca: '+e.message+'</span>'; }
  };
}

function blCreateInviteLink(user){
  const base = window.location.origin + window.location.pathname;
  const name = encodeURIComponent((user.displayName || user.email || 'Amigo').split(' ')[0]);
  return `${base}?invite=${encodeURIComponent(user.uid)}&name=${name}`;
}

async function blCopyText(text){
  try { await navigator.clipboard.writeText(text); return true; }
  catch(e){
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); document.body.removeChild(ta); return true; }
    catch(err){ document.body.removeChild(ta); return false; }
  }
}

function blOpenInviteModal(user){
  const link = blCreateInviteLink(user);
  const existing = document.getElementById('blInviteModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'blInviteModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  modal.innerHTML = `<div style="width:min(620px,100%);background:#161b27;border:1px solid #2a3248;border-radius:18px;padding:22px;color:#e2e8f0;box-shadow:0 20px 70px rgba(0,0,0,.55)">
    <h2 style="margin:0 0 8px">🤝 Convidar amigo</h2>
    <p style="color:#8892a8;line-height:1.45;margin:0 0 14px">Envie este link para o Daniel. Quando ele abrir e entrar com Google, a amizade será criada automaticamente e o Modo Batalha será liberado para vocês dois.</p>
    <input id="blInviteInput" value="${link.replace(/"/g,'&quot;')}" readonly style="width:100%;padding:12px;border-radius:10px;border:1px solid #2a3248;background:#0d1117;color:#e2e8f0;margin-bottom:12px">
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
      <button id="blInviteCopy" style="border:none;border-radius:10px;background:#8b7cf8;color:white;font-weight:800;padding:10px 14px;cursor:pointer">Copiar link</button>
      <button id="blInviteClose" style="border:1px solid #2a3248;border-radius:10px;background:#1e2535;color:#e2e8f0;padding:10px 14px;cursor:pointer">Fechar</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('blInviteClose').onclick = () => modal.remove();
  document.getElementById('blInviteCopy').onclick = async () => {
    const ok = await blCopyText(link);
    document.getElementById('blInviteCopy').textContent = ok ? '✅ Link copiado' : 'Copie manualmente';
  };
}



// ════════════════════════════════════════════════
// BOOKLEGACY V7.6 — MIGRAÇÃO NO APP
// Permite importar JSON da base antiga dentro do usuário Google logado.
// ════════════════════════════════════════════════
function blMigrationShell(){
  const existing = document.getElementById('blMigrationModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'blMigrationModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.76);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  modal.innerHTML = `<div style="width:min(860px,100%);max-height:92vh;overflow:auto;background:#161b27;border:1px solid #2a3248;border-radius:18px;padding:22px;color:#e2e8f0;box-shadow:0 20px 70px rgba(0,0,0,.55)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px">
      <div><h2 style="margin:0 0 4px">📥 Migração de dados</h2><p style="color:#8892a8;margin:0;line-height:1.45">Importe um arquivo JSON convertido para a conta Google logada agora. Use isso para Daniel importar os dados dele logado na conta dele.</p></div>
      <button id="blMigrationClose" style="border:1px solid #2a3248;border-radius:10px;background:#1e2535;color:#e2e8f0;padding:9px 12px;cursor:pointer">Fechar</button>
    </div>
    <div style="background:#0d1117;border:1px solid #2a3248;border-radius:14px;padding:16px;margin-bottom:14px">
      <div id="blMigrationUser" style="font-size:13px;color:#8892a8;margin-bottom:12px"></div>
      <input id="blMigrationFile" type="file" accept="application/json,.json" style="width:100%;padding:12px;border-radius:10px;border:1px solid #2a3248;background:#161b27;color:#e2e8f0;margin-bottom:12px">
      <div id="blMigrationPreview" style="font-size:13px;color:#8892a8;line-height:1.55;margin-bottom:12px">Selecione o arquivo JSON de migração.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button id="blMigrationImportBtn" disabled style="border:none;border-radius:10px;background:#8b7cf8;color:white;font-weight:900;padding:10px 14px;cursor:pointer;opacity:.6">Importar para esta conta</button>
        <button id="blMigrationReloadBtn" style="border:1px solid #4ecdc4;border-radius:10px;background:rgba(78,205,196,.12);color:#4ecdc4;font-weight:800;padding:10px 14px;cursor:pointer">Recarregar dashboard</button>
      </div>
    </div>
    <div id="blMigrationLog" style="background:#0d1117;border:1px solid #2a3248;border-radius:14px;padding:14px;color:#8892a8;font-family:ui-monospace,Consolas,monospace;font-size:12px;white-space:pre-wrap;min-height:74px">Aguardando arquivo...</div>
  </div>`;
  document.body.appendChild(modal);
  const st = document.createElement('style');
  st.textContent = '@media(max-width:800px){#blMigrationModal{align-items:flex-start!important;padding:10px!important}#blMigrationModal button{width:100%;}}';
  modal.appendChild(st);
  document.getElementById('blMigrationClose').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  return modal;
}

function blMigrationLog(msg){
  const el = document.getElementById('blMigrationLog');
  if (el) el.textContent = msg;
}

function blMigrationCounts(d){
  const count = (k) => Array.isArray(d && d[k]) ? d[k].length : 0;
  return { books:count('books'), library:count('library'), sessions:count('sessions'), ratings:count('ratings'), goals:count('goals'), collections:count('collections') };
}

async function blReadMigrationFile(file){
  const text = await file.text();
  return JSON.parse(text);
}

function blValidateMigrationData(data, currentUser){
  if (!data || typeof data !== 'object') throw new Error('JSON inválido.');
  if (data.format && data.format !== 'booklegacy-migration-v1') throw new Error('Formato de migração não reconhecido: ' + data.format);
  ['books','library','sessions','ratings','goals','collections'].forEach(k => {
    if (!Array.isArray(data[k])) data[k] = [];
  });
  if (data.expectedUid && data.expectedUid !== currentUser.uid) {
    throw new Error('Este JSON foi preparado para outro usuário. Esperado: ' + data.expectedUid + ' / logado: ' + currentUser.uid);
  }
  return data;
}

async function blCommitBatchChunks(writeFns, onProgress){
  const db = window.BL.db;
  let batch = db.batch();
  let pending = 0;
  let done = 0;
  for (const fn of writeFns) {
    fn(batch);
    pending++;
    done++;
    if (pending >= 420) {
      await batch.commit();
      if (onProgress) onProgress(done);
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending) {
    await batch.commit();
    if (onProgress) onProgress(done);
  }
}

async function blImportMigrationData(data){
  const user = window.BL.auth.currentUser;
  if (!user) throw new Error('Entre com Google antes de importar.');
  data = blValidateMigrationData(data, user);
  const uid = user.uid;
  const db = window.BL.db;
  const now = new Date().toISOString();
  const writes = [];
  const addSet = (ref, payload) => writes.push(batch => batch.set(ref, {...payload, importedAt: payload.importedAt || now}, { merge:true }));

  (data.books||[]).forEach(b => {
    const id = b.id || b.bookId || ('book_' + blSlug(b.title || b.livro || b.nome));
    addSet(db.collection('books').doc(id), {...b, id: undefined, updatedAt: now});
  });
  (data.library||[]).forEach(item => {
    const id = item.id || ('lib_' + blSlug(item.title || item.livro || item.bookId));
    addSet(db.collection('users').doc(uid).collection('library').doc(id), {...item, id: undefined, updatedAt: now});
  });
  (data.sessions||[]).forEach(s => {
    const id = s.id || ('sess_' + blSlug((s.date||'') + '_' + (s.title||s.livro||'') + '_' + Math.random().toString(36).slice(2,8)));
    addSet(db.collection('users').doc(uid).collection('sessions').doc(id), {...s, id: undefined, updatedAt: now});
  });
  (data.ratings||[]).forEach(r => {
    const id = r.id || ('rat_' + blSlug((r.title||r.livro||'') + '_' + (r.readingYear||r.ano||'')));
    addSet(db.collection('users').doc(uid).collection('ratings').doc(id), {...r, id: undefined, updatedAt: now});
  });
  (data.goals||[]).forEach(g => {
    const id = g.id || String(g.year || g.ano || 'goal_' + Date.now());
    addSet(db.collection('users').doc(uid).collection('goals').doc(String(id)), {...g, id: undefined, updatedAt: now});
  });
  (data.collections||[]).forEach(c => {
    const id = c.id || ('col_' + blSlug(c.name || c.nome || c.collection || c.colecao));
    addSet(db.collection('users').doc(uid).collection('collections').doc(id), {...c, id: undefined, updatedAt: now});
  });

  await blCommitBatchChunks(writes, (done) => blMigrationLog(`Importando... ${done}/${writes.length} registros gravados.`));
  return { totalWrites:writes.length, ...blMigrationCounts(data) };
}

async function blOpenMigrationModal(){
  const user = window.BL && window.BL.auth && window.BL.auth.currentUser;
  if (!user) return alert('Entre com Google primeiro.');
  blMigrationShell();
  document.getElementById('blMigrationUser').innerHTML = `Conta logada: <b style="color:#e2e8f0">${user.displayName || user.email || user.uid}</b><br><span style="font-size:12px">UID: ${user.uid}</span>`;
  let selectedData = null;
  const fileInput = document.getElementById('blMigrationFile');
  const importBtn = document.getElementById('blMigrationImportBtn');
  const preview = document.getElementById('blMigrationPreview');
  fileInput.onchange = async () => {
    selectedData = null;
    importBtn.disabled = true; importBtn.style.opacity = '.6';
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const data = await blReadMigrationFile(file);
      blValidateMigrationData(data, user);
      const c = blMigrationCounts(data);
      selectedData = data;
      preview.innerHTML = `<b style="color:#e2e8f0">${file.name}</b><br>Livros globais: ${c.books} · Biblioteca: ${c.library} · Sessões: ${c.sessions} · Notas: ${c.ratings} · Metas: ${c.goals} · Coleções: ${c.collections}`;
      blMigrationLog('Arquivo validado. Clique em importar.');
      importBtn.disabled = false; importBtn.style.opacity = '1';
    } catch(e) {
      preview.innerHTML = '<span style="color:#f88c6a">Erro no arquivo: '+e.message+'</span>';
      blMigrationLog('Erro: ' + e.message);
    }
  };
  importBtn.onclick = async () => {
    if (!selectedData) return;
    const c = blMigrationCounts(selectedData);
    const ok = confirm(`Importar para a conta logada agora?\n\nBiblioteca: ${c.library}\nSessões: ${c.sessions}\nNotas: ${c.ratings}\n\nUse isso somente na conta correta.`);
    if (!ok) return;
    importBtn.disabled = true; importBtn.textContent = 'Importando...';
    try {
      const res = await blImportMigrationData(selectedData);
      blMigrationLog(`✅ Importação concluída.\nGravações: ${res.totalWrites}\nBiblioteca: ${res.library}\nSessões: ${res.sessions}\nNotas: ${res.ratings}\n\nRecarregando dashboard...`);
      await blRefreshAndRender();
      importBtn.textContent = '✅ Importado';
    } catch(e) {
      blMigrationLog('❌ Erro na importação: ' + e.message);
      importBtn.disabled = false; importBtn.textContent = 'Importar para esta conta';
    }
  };
  document.getElementById('blMigrationReloadBtn').onclick = async () => {
    blMigrationLog('Recarregando dados...');
    try { await blRefreshAndRender(); blMigrationLog('✅ Dashboard recarregado.'); }
    catch(e){ blMigrationLog('❌ Erro ao recarregar: ' + e.message); }
  };
}
window.blOpenMigrationModal = blOpenMigrationModal;

function blSetupLoadingWatchdog(){
  setTimeout(() => {
    const loading = document.getElementById('loading');
    const app = document.getElementById('app');
    const overlay = document.getElementById('authOverlay');
    if (loading && loading.style.display !== 'none' && (!app || app.style.display === 'none') && (!overlay || overlay.style.display !== 'flex')) {
      loading.innerHTML = '<div style="max-width:720px;margin:30px auto;background:#161b27;border:1px solid #f88c6a;border-radius:16px;padding:24px;color:#e2e8f0;text-align:left"><h2 style="color:#f88c6a;margin-bottom:10px">⚠️ O carregamento demorou demais</h2><p>Isso geralmente é configuração do Firebase, regra do Firestore ou erro de permissão ao ler dados.</p><p style="color:#8892a8;margin-top:10px">Abra o Console do navegador ou mande print da tela. Você também pode voltar para a versão anterior pelo histórico de deploys da Vercel.</p><button onclick="location.reload()" style="margin-top:14px;background:#8b7cf8;color:white;border:none;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer">Recarregar</button></div>';
    }
  }, 12000);
}
blSetupLoadingWatchdog();

async function iniciarAppFirebase(){
  const overlay = document.getElementById('authOverlay');
  const btn = document.getElementById('authLoginBtn');
  const err = document.getElementById('authError');
  if (btn) btn.onclick = async () => {
    err.textContent = '';
    try { await window.BL.auth.signInWithPopup(window.BL.provider); }
    catch(e){ err.textContent = 'Erro no login: ' + e.message; }
  };
  window.BL.auth.onAuthStateChanged(async (user) => {
    try {
      if (!user) {
        if (overlay) overlay.style.display = 'flex';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'none';
        return;
      }
      if (overlay) overlay.style.display = 'none';
      const loadingEl = document.getElementById('loading');
      loadingEl.style.display = 'block';
      loadingEl.innerHTML = '⏳ Login feito. Preparando seu perfil...';
      blDecorateHeader(user);
      await blEnsureUserProfile(user);
      loadingEl.innerHTML = '⏳ Verificando convites e amizades...';
      await blAcceptInviteIfPresent(user);
      loadingEl.innerHTML = '⏳ Carregando sua biblioteca do Firebase...';
      await blRefreshAndRender();
    } catch(e) {
      document.getElementById('loading').innerHTML = '<p style="color:#f88c6a;padding:40px;text-align:center">⚠️ Erro ao carregar Firebase: '+e.message+'</p>';
      console.error(e);
    }
  });
}

function blDecorateHeader(user){
  const headerRight = document.querySelector('header > div:last-child');
  if (!headerRight || document.getElementById('blProfile')) return;
  const oldUserBox = headerRight.querySelector('div');
  if (oldUserBox) oldUserBox.style.display = 'none';
  const el = document.createElement('div');
  el.id = 'blProfile';
  el.className = 'bl-profile';
  el.innerHTML = `${user.photoURL ? `<img src="${user.photoURL}" alt="">` : ''}<span>Google: ${user.displayName || user.email || 'Usuário'}</span><button type="button" id="blInviteBtn">Comunidade</button><button type="button" id="blLogout">Sair</button>`;
  headerRight.prepend(el);
  document.getElementById('blInviteBtn').onclick = () => blOpenCommunityModal();
  document.getElementById('blLogout').onclick = () => window.BL.auth.signOut();
}


function blSetupInstallButton(){
  let deferredPrompt = null;
  const btn = document.getElementById('appInstallBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; if (btn) btn.style.display = 'inline-flex';
  });
  if (btn) btn.onclick = async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; btn.style.display = 'none'; }
    else alert('No celular: abra no Chrome/Edge e use “Adicionar à tela inicial” ou “Instalar app”. No iPhone: Compartilhar → Adicionar à Tela de Início.');
  };
}
blSetupInstallButton();

iniciarAppFirebase();
