
// ── Usuário ───────────────────────────────────────
let usuarioAtual = 'Milton';

function setUsuario(usuario) {
  usuarioAtual = usuario;

  // Atualiza botões
  ['Milton','Daniel','Batalha'].forEach(u => {
    const btn = document.getElementById('btn-user-' + u.toLowerCase());
    const ativo = u === usuario;
    btn.style.background = ativo ? (u === 'Batalha' ? '#e56cff' : 'var(--purple)') : 'transparent';
    btn.style.color = ativo ? 'white' : 'var(--muted)';
  });

  document.getElementById('pageDashboard').style.display = usuario === 'Batalha' ? 'none' : 'block';
  document.getElementById('pageBatalha').style.display   = usuario === 'Batalha' ? 'block' : 'none';
  const lendoWrap = document.querySelector('.lendo-wrap');
  if (lendoWrap) lendoWrap.style.display = usuario === 'Batalha' ? 'none' : '';
  document.querySelector('.lendo-wrap').style.display    = usuario === 'Batalha' ? 'none' : 'block';
  document.querySelector('.fab').style.display           = usuario === 'Batalha' ? 'none' : 'flex';
  // Force hide all dashboard sections when in battle mode
  if (usuario === 'Batalha') {
    document.querySelectorAll('#app > .sec, #app > .card, #app > .grid2, #app > .grid3, #app > .grid4, #app > div:not(#pageDashboard):not(#pageBatalha)').forEach(el => { el.style.display = 'none'; });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  } else {
    document.querySelectorAll('#app > *').forEach(el => { el.style.display = ''; });
    // Restaura o grid dos 4 kpi cards explicitamente
    const kg = document.getElementById('kpi-books-grid');
    if (kg) kg.style.display = 'grid';
  }

  if (usuario === 'Batalha') {
    renderBatalha();
    if (isMobile()) setTimeout(applyMobileLayout, 400);
    return;
  }

  const d = window._dadosD;
  if (!d) return;

  // Filtro estrito por usuário:
  // - Registros sem usuario (vazios) = dados legados = vão para Milton
  // - Registros com usuario preenchido = pertencem a esse usuário
  const todasSessoes = d.sessoes || [];
  const sessoesFiltradas = todasSessoes.filter(s =>
    usuario === 'Milton'
      ? (!s.usuario || s.usuario === '' || s.usuario.toUpperCase() === 'MILTON')
      : s.usuario?.toUpperCase() === usuario.toUpperCase()
  );

  const todoLivros = [...(d.livros||[]), ...(d.lendo||[]), ...(d.pausados||[]), ...(d.aguardando||[])];
  const livroMap = new Map();
  todoLivros
    .filter(l =>
      usuario === 'Milton'
        ? (!l.usuario || l.usuario === '' || l.usuario.toUpperCase() === 'MILTON')
        : l.usuario?.toUpperCase() === usuario.toUpperCase()
    )
    .forEach(l => { if (!livroMap.has(l.livro)) livroMap.set(l.livro, l); });

  window._sessoes = sessoesFiltradas;
  window._livros  = [...livroMap.values()];

  // Reset livrosCache para forçar recarregamento com livros do novo usuário
  livrosCache = [...livroMap.values()].map(l => ({
    livro: l.livro, autor: l.autor || '', status: l.status,
    isbn: l.isbn || '', coverUrl: l.coverUrl || '',
    colecao: l.colecao || '', depende: l.depende || '',
    ordemColecao: l.ordemColecao || 0, totalPag: l.totalPag || 0,
    pagAtual: l.pagAtual || 0, metaAno: l.metaAno || '', usuario: l.usuario || usuario
  }));
  // Limpa campos de busca dos modais PWA
  ['s-livro','n-livro','l-livro','ex-livro'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  ['s-livro-busca','n-livro-busca','l-livro-busca','ex-livro-busca'].forEach(id => {
    const el = document.getElementById(id); if(el) { el.value=''; el.placeholder='Digite para buscar...'; }
  });
  ['s-livro-selecionado','n-livro-sel','l-livro-sel','ex-livro-sel'].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display='none';
  });

  document.getElementById('header-badge').textContent = `${livroMap.size} livros · ${sessoesFiltradas.length} sessões`;

  // Recalcula TUDO com os dados filtrados do usuário
  recalcularDados(d, sessoesFiltradas);
}

function renderBatalha() {
  const d = window._dadosD;
  if (!d) return;

  const pA = document.getElementById('bat-playerA')?.value || 'Milton';
  const pB = document.getElementById('bat-playerB')?.value || 'Daniel';
  const CA = '#A855F7', CB = '#FB923C';

  // Popula seletor de anos — guarda valor ANTES de limpar
  const selAno = document.getElementById('bat-ano');
  const anoGuardado = selAno?.value || 'total';
  if (selAno) {
    const anosDisp = [...new Set((d.sessoes||[]).map(s=>s.ano).filter(a=>a>2000))].sort();
    selAno.innerHTML = '<option value="total">Todos os anos</option>';
    anosDisp.forEach(a => {
      const opt = document.createElement('option');
      opt.value = String(a); opt.textContent = '⚔️ Season ' + a;
      selAno.appendChild(opt);
    });
    // Restaura seleção anterior
    if (selAno.querySelector(`option[value="${anoGuardado}"]`)) selAno.value = anoGuardado;
  }
  const anoFiltro = selAno?.value || 'total';

  function calcDados(u) {
    const filterU = l => u === 'Milton'
      ? (!l.usuario || l.usuario === '' || l.usuario.toUpperCase() === 'MILTON')
      : l.usuario?.toUpperCase() === u.toUpperCase();
    const sess  = (d.sessoes||[]).filter(filterU).filter(s => anoFiltro === 'total' || String(s.ano) === String(anoFiltro));
    const todos = [...(d.livros||[]),...(d.lendo||[]),...(d.pausados||[]),...(d.aguardando||[])].filter(filterU);
    const lidos = todos.filter(l=>l.status==='Completo').filter(l => {
      if (anoFiltro === 'total') return true;
      // filtra livros concluídos no ano selecionado (verificando sessões)
      return sess.some(s => s.livro === l.livro);
    });
    const notas = (d.notas||[]).filter(filterU).filter(n => anoFiltro === 'total' || String(n.ano) === String(anoFiltro));
    const diasSet = new Set(sess.map(s=>s.data).filter(Boolean));
    const pagTotal = sess.reduce((a,s)=>a+s.paginas,0);
    const horas = Math.round(sess.reduce((a,s)=>a+(s.minutos||0),0)/60);
    const media = diasSet.size>0 ? Math.round(pagTotal/diasSet.size*10)/10 : 0;
    const notaMedia = notas.length ? notas.reduce((a,n)=>a+n.media,0)/notas.length : null;
    // streak
    const diasOrdem=[...diasSet].sort();
    let streakAtual=0,streakRecord=0,cur=0;
    for(let i=0;i<diasOrdem.length;i++){
      if(i===0){cur=1;}else{
        const diff=Math.round((new Date(diasOrdem[i]+'T12:00:00')-new Date(diasOrdem[i-1]+'T12:00:00'))/86400000);
        cur=diff===1?cur+1:1;
      }
      streakRecord=Math.max(streakRecord,cur);
    }
    const hojeStr=new Date().toISOString().slice(0,10);
    const ontemStr=new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(diasSet.has(hojeStr)||diasSet.has(ontemStr)){
      let c=new Date((diasSet.has(hojeStr)?hojeStr:ontemStr)+'T12:00:00');
      while(diasSet.has(c.toISOString().slice(0,10))){streakAtual++;c=new Date(c-86400000);}
    }
    // bosses
    const bosses=lidos.filter(l=>l.totalPag>=1000);
    // autor top
    const autMap={};
    sess.forEach(s=>{const l=todos.find(x=>x.livro===s.livro);const a=l?.autor||'?';autMap[a]=(autMap[a]||0)+s.paginas;});
    const autorTop=Object.entries(autMap).sort((a,b)=>b[1]-a[1])[0];
    // meses
    const mesPags={};
    sess.forEach(s=>{if(!s.data)return;const ym=s.data.slice(0,7);mesPags[ym]=(mesPags[ym]||0)+s.paginas;});
    // wd
    const wdMap=[0,0,0,0,0,0,0];
    sess.forEach(s=>{if(s.data){const wd=new Date(s.data+'T12:00:00').getDay();wdMap[wd]+=s.paginas;}});
    const eficiencia=horas>0?Math.round(pagTotal/horas):0;
    const maiorSessao=sess.reduce((mx,s)=>s.paginas>mx?s.paginas:mx,0);
    const colSet=new Set(lidos.map(l=>l.colecao).filter(Boolean));
    // meta pct
    const metasPorAno=window._dadosD?.metasPorAno||{};
    const anoAtual=new Date().getFullYear().toString();
    const metaAno=Object.keys(metasPorAno).find(k=>k===anoAtual);
    const metaLidos=lidos.filter(l=>l.metaAno===anoAtual).length;
    const metaTotal=metaAno?(metasPorAno[metaAno]?.total||0):0;
    const metaPct=metaTotal>0?Math.round(metaLidos/metaTotal*100):0;
    // Séries concluídas — coleções onde todos os livros estão completos
    const colMap = {};
    todos.forEach(l => {
      if (!l.colecao) return;
      if (!colMap[l.colecao]) colMap[l.colecao] = { total:0, lidos:0 };
      colMap[l.colecao].total++;
      if (l.status === 'Completo') colMap[l.colecao].lidos++;
    });
    const seriesConcluidas = Object.values(colMap).filter(c => c.total > 1 && c.lidos === c.total).length;

    // Gêneros diferentes
    const generosSet = new Set(todos.filter(l => l.genero && l.status === 'Completo').map(l => l.genero));

    return {u,sess,todos,lidos,notas,diasSet,pagTotal,horas,media,notaMedia,
      streakAtual,streakRecord,bosses,autorTop,mesPags,wdMap,eficiencia,
      maiorSessao,colSet,sessoes:sess.length,metaPct,metaLidos,metaTotal,
      autMap,seriesConcluidas,generosSet};
  }

  const dA=calcDados(pA), dB=calcDados(pB);

  // Poder geral
  const poderA=dA.pagTotal*0.4+dA.lidos.length*200+dA.horas*10+dA.streakAtual*50+(dA.notaMedia||0)*100;
  const poderB=dB.pagTotal*0.4+dB.lidos.length*200+dB.horas*10+dB.streakAtual*50+(dB.notaMedia||0)*100;
  const tot=poderA+poderB||1;
  const pctA=Math.round(poderA/tot*100), pctB=100-pctA;

  // Vitórias mensais
  const allM=new Set([...Object.keys(dA.mesPags),...Object.keys(dB.mesPags)]);
  let vitA=0,vitB=0,emp=0;
  allM.forEach(m=>{const a=dA.mesPags[m]||0,b=dB.mesPags[m]||0;if(a>b)vitA++;else if(b>a)vitB++;else if(a>0)emp++;});

  // Radar
  // ── Perfil de Combate — tetos fixos por temporada (0-10) ─────────
  const TETOS_BASE = { paginas:15000, velocidade:80, notaMax:10, bosses:10, variedade:40 };

  const hoje = new Date(); hoje.setHours(12,0,0,0);

  // Dias do período por player:
  // - ano específico: 1 jan até 31 dez (ou hoje se ano atual)
  // - total: primeira sessão do player até hoje
  function calcDiasPeriodo(dd) {
    const todasDatas = (dd.sess||[]).map(s=>s.data).filter(Boolean).sort();
    if (!todasDatas.length) return 365;
    if (anoFiltro === 'total') {
      const primeira = new Date(todasDatas[0]+'T12:00:00');
      return Math.max(1, Math.round((hoje - primeira)/86400000)+1);
    } else {
      // Ano específico: sempre 1/jan até 31/dez (ou hoje se ano atual)
      const anoNum = parseInt(anoFiltro);
      const inicio = new Date(anoNum, 0, 1, 12);
      const fim = anoNum === hoje.getFullYear() ? hoje : new Date(anoNum, 11, 31, 12);
      return Math.max(1, Math.round((fim - inicio)/86400000)+1);
    }
  }

  // Número de anos ativos por player
  function anosAtivos(dd) {
    const anos = new Set((dd.sess||[]).map(s=>s.data?.slice(0,4)).filter(Boolean));
    return Math.max(anos.size, 1);
  }

  function calcRadar(dd){
    const clamp = (val,teto) => Math.min(parseFloat((Math.max(val,0)/Math.max(teto,1)*10).toFixed(1)), 10);

    // Escala tetos pelo número de anos ativos se filtro = total
    const anos = anoFiltro === 'total' ? anosAtivos(dd) : 1;
    const TETOS = {
      paginas:  TETOS_BASE.paginas  * anos,
      bosses:   TETOS_BASE.bosses   * anos,
      variedade:TETOS_BASE.variedade * anos,
      velocidade:TETOS_BASE.velocidade,
      notaMax:   TETOS_BASE.notaMax,
    };

    // 1. Volume
    const volume = clamp(dd.pagTotal, TETOS.paginas);

    // 2. Consistência: dias lidos / período real do player
    const diasPeriodoPlayer = calcDiasPeriodo(dd);
    const consistencia = clamp(dd.diasSet.size, diasPeriodoPlayer);

    // 3. Velocidade: média págs nos dias lidos
    const diasLidos = dd.diasSet.size || 1;
    const velocidade = clamp(dd.pagTotal / diasLidos, TETOS.velocidade);

    // 4. Qualidade
    const qualidade = clamp(dd.notaMedia||0, TETOS.notaMax);

    // 5. Resistência
    const resistencia = clamp(dd.bosses.length, TETOS.bosses);

    // 6. Variedade
    const autUnicos = Object.keys(dd.autMap||{}).length;
    const genUnicos = dd.generosSet?.size||0;
    const variedade = clamp(autUnicos+genUnicos, TETOS.variedade);

    return [volume, consistencia, velocidade, qualidade, resistencia, variedade];
  }
  const radarA=calcRadar(dA);
  const radarB=calcRadar(dB);

  // Últimos 12 meses
  const meses12=[],mesesLbl=[];
  const mNomes=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  for(let i=11;i>=0;i--){const d2=new Date();d2.setDate(1);d2.setMonth(d2.getMonth()-i);meses12.push(d2.toISOString().slice(0,7));mesesLbl.push(mNomes[d2.getMonth()]);}

  // Rank title
  function rankTitle(dd){
    if(dd.lidos.length>=100)return'👑 Lendário';
    if(dd.lidos.length>=50)return'💎 Épico';
    if(dd.lidos.length>=20)return'🥇 Veterano';
    if(dd.lidos.length>=10)return'🥈 Intermediário';
    return'🥉 Iniciante';
  }
  function rankLvl(dd){return Math.min(99,Math.floor(dd.lidos.length*0.8+dd.horas*0.1+dd.streakRecord*0.3));}

  // SVG avatar placeholder
  function avatar(cor,emoji){
    return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="width:80px;height:80px;">
      <defs><radialGradient id="ag${cor.replace('#','')}"><stop offset="0%" stop-color="${cor}" stop-opacity="0.3"/><stop offset="100%" stop-color="${cor}" stop-opacity="0.05"/></radialGradient></defs>
      <circle cx="40" cy="40" r="38" fill="url(#ag${cor.replace('#','')})" stroke="${cor}" stroke-width="2"/>
      <circle cx="40" cy="30" r="14" fill="${cor}" fill-opacity="0.2" stroke="${cor}" stroke-width="1.5"/>
      <path d="M16 68 Q40 52 64 68" fill="${cor}" fill-opacity="0.15" stroke="${cor}" stroke-width="1.5"/>
      <text x="40" y="35" text-anchor="middle" dominant-baseline="middle" font-size="18">${emoji}</text>
    </svg>`;
  }

  // Medalhas
  // ── Sistema de Conquistas por Tier ──────────────────────────────
  const TIERS = [
    { nome:'Bronze',  min:0, cor:'#B87333', glow:'rgba(184,115,51,0.5)',  borda:'#A16207', anim:false },
    { nome:'Prata',   min:1, cor:'#C0C0C0', glow:'rgba(192,192,192,0.5)', borda:'#CBD5E1', anim:false },
    { nome:'Ouro',    min:2, cor:'#FACC15', glow:'rgba(250,204,21,0.6)',  borda:'#EAB308', anim:false },
    { nome:'Platina', min:3, cor:'#22C55E', glow:'rgba(34,197,94,0.65)',  borda:'#16A34A', anim:false },
    { nome:'Diamante',min:4, cor:'#38BDF8', glow:'rgba(56,189,248,0.7)',  borda:'#2563EB', anim:false },
    { nome:'Mestre',  min:5, cor:'#A855F7', glow:'rgba(147,51,234,0.9)',  borda:'#9333EA', anim:true  },
  ];

  function getTier(val, thresholds) {
    // thresholds: [bronze, prata, ouro, platina, diamante, mestre]
    let tier = -1;
    for (let i = 0; i < thresholds.length; i++) {
      if (val >= thresholds[i]) tier = i; else break;
    }
    return tier;
  }

  function conquista(icon, nome, val, thresholds, labels, descFn) {
    const tierIdx = getTier(val, thresholds);
    if (tierIdx < 0) return null;
    const t = TIERS[tierIdx];
    const next = thresholds[tierIdx + 1];
    const pct = next ? Math.round((val - thresholds[tierIdx]) / (next - thresholds[tierIdx]) * 100) : 100;
    const progLabel = next ? `${val.toLocaleString('pt-BR')} / ${next.toLocaleString('pt-BR')}` : `${val.toLocaleString('pt-BR')} ✓`;
    const borderStyle = t.anim
      ? `border:2px solid transparent; background-clip:padding-box; box-shadow:0 0 0 2px #9333EA, 0 0 0 3px #FACC15, 0 0 28px rgba(147,51,234,0.8), 0 0 12px rgba(250,204,21,0.5); animation:bat-mestre 3s linear infinite;`
      : `border:2px solid ${t.borda}; box-shadow:0 0 18px ${t.glow};`;
    return { icon, nome, tierNome: t.nome, tierCor: t.cor, borderStyle, pct, progLabel, tip: descFn(val) };
  }

  // Títulos Exclusivos — calculados FORA de medalhas, apenas o melhor de cada categoria recebe
  function calcTitulos(ddA, ddB) {
    const autA = Object.keys(ddA.autMap||{}).length;
    const autB = Object.keys(ddB.autMap||{}).length;
    const titulosA = [], titulosB = [];

    const disputa = (icon, nome, valA, valB, tipFn) => {
      if (valA === 0 && valB === 0) return;
      if (valA > valB) titulosA.push({icon, nome, tip: tipFn(valA)});
      else if (valB > valA) titulosB.push({icon, nome, tip: tipFn(valB)});
      // empate = ninguém recebe
    };

    disputa('👑','Rei das Páginas',      ddA.pagTotal,           ddB.pagTotal,           v=>`${v.toLocaleString('pt-BR')} páginas — maior total`);
    disputa('🏛️','Imperador da Biblioteca',ddA.lidos.length,     ddB.lidos.length,       v=>`${v} livros concluídos — maior biblioteca`);
    disputa('⏳','Senhor do Tempo',       ddA.horas,              ddB.horas,              v=>`${v}h de leitura — maior stamina`);
    disputa('🔥','Combo Supremo',         ddA.streakRecord,       ddB.streakRecord,       v=>`Streak recorde: ${v} dias`);
    disputa('🧠','Crítico Supremo',       ddA.notaMedia||0,       ddB.notaMedia||0,       v=>`Nota média ${v.toFixed(1)} — avaliações mais refinadas`);
    disputa('⚡','Leitor Relâmpago',      Math.round(ddA.media),  Math.round(ddB.media),  v=>`Média de ${v} págs/dia — mais veloz`);
    disputa('💀','Boss Slayer',           ddA.bosses.length,      ddB.bosses.length,      v=>`${v} bosses (1000+ págs) — mais poderoso`);
    disputa('📅','Dominador das Sessões', ddA.sessoes,            ddB.sessoes,            v=>`${v} sessões registradas — mais disciplinado`);
    disputa('🏆','Senhor das Séries',     ddA.seriesConcluidas||0,ddB.seriesConcluidas||0,v=>`${v} séries completas`);
    disputa('🌎','Explorador Supremo',    autA,                   autB,                   v=>`${v} autores diferentes`);
    disputa('🛡️','Monarca da Consistência',ddA.diasSet?.size||0, ddB.diasSet?.size||0,   v=>`${v} dias de leitura registrados`);
    disputa('🐛','Mestre dos Slimes',     ddA.lidos.filter(l=>l.totalPag>0&&l.totalPag<=200).length, ddB.lidos.filter(l=>l.totalPag>0&&l.totalPag<=200).length, v=>`${v} livros até 200 págs`);

    return { titulosA, titulosB };
  }

  const { titulosA, titulosB } = calcTitulos(dA, dB);

  function renderTitulos(titulos) {
    if (!titulos.length) return '';
    return `<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">
      <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:3px;color:rgba(250,204,21,0.8);margin-bottom:10px;text-shadow:0 0 8px rgba(250,204,21,0.4);">✨ TÍTULOS EXCLUSIVOS</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${titulos.map(t=>`
        <div class="bat-conquista" data-tip="${t.tip}" style="min-width:70px;max-width:82px;">
          <div class="bat-conquista-icon" style="background:radial-gradient(circle at 35% 35%,#1a1020,#070B14);border:2px solid transparent;box-shadow:0 0 0 2px #9333EA,0 0 0 3px #FACC15,0 0 20px rgba(147,51,234,0.7),0 0 8px rgba(250,204,21,0.4);animation:bat-mestre 3s linear infinite;">
            <span style="font-size:20px;">${t.icon}</span>
          </div>
          <div style="font-family:'Orbitron',sans-serif;font-size:8px;font-weight:700;color:#FACC15;text-align:center;letter-spacing:0.5px;margin-top:4px;text-shadow:0 0 8px rgba(250,204,21,0.5);">${t.nome}</div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function medalhas(dd, titulos) {
    const autoresCount = Object.keys(dd.autMap || {}).length;
    const conquistas = [
      conquista('📖', 'Domínio de Páginas',   dd.pagTotal,              [1000,5000,15000,30000,60000,100000], [], v=>`${v.toLocaleString('pt-BR')} páginas lidas`),
      conquista('📚', 'Grimório Completo',     dd.lidos.length,          [5,15,30,50,80,120],                  [], v=>`${v} livros concluídos`),
      conquista('⏳', 'Stamina Total',         dd.horas,                 [50,150,300,500,800,1200],             [], v=>`${v}h de leitura`),
      conquista('🔥', 'Combo de Leitura',      dd.streakRecord,          [7,14,30,60,100,180],                 [], v=>`Streak recorde: ${v} dias`),
      conquista('⚡', 'Velocidade',            Math.round(dd.media),     [10,30,50,80,120,200],                [], v=>`Média de ${v} págs/dia`),
      conquista('📅', 'Sessões de Treino',     dd.sessoes,               [20,80,200,400,700,1000],             [], v=>`${v} sessões registradas`),
      conquista('🧠', 'Crítico Literário',     dd.notaMedia||0,          [5,6,7,7.5,8,9],                     [], v=>`Nota média: ${v.toFixed(1)}`),
      conquista('💀', 'Boss Slayer',           dd.bosses.length,         [1,5,10,20,35,50],                   [], v=>`${v} livros 1000+ págs`),
      conquista('🏛️', 'Explorador de Reinos',  dd.colSet.size,           [3,8,15,25,40,60],                   [], v=>`${v} coleções exploradas`),
      conquista('✍️', 'Colecionador',          autoresCount,             [5,15,30,50,80,120],                  [], v=>`${v} autores diferentes`),
      conquista('🏆', 'Senhor das Séries',     dd.seriesConcluidas||0,   [1,3,5,8,12,20],                     [], v=>`${v} séries concluídas`),
      conquista('🌎', 'Mestre dos Gêneros',    dd.generosSet?.size||0,   [2,4,6,8,10,12],                     [], v=>`${v} gêneros explorados`),
    ].filter(Boolean);

    const htmlConquistas = conquistas.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-start;">
          ${conquistas.map(c => `
          <div class="bat-conquista" data-tip="${c.tip}" style="min-width:80px;max-width:90px;">
            <div class="bat-conquista-icon" style="background:radial-gradient(circle at 35% 35%,rgba(15,23,42,0.9),#070B14);${c.borderStyle}">
              <span style="font-size:22px;">${c.icon}</span>
            </div>
            <div class="bat-conquista-name" style="font-size:9px;color:#F8FAFC;">${c.nome}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:8px;font-weight:700;color:${c.tierCor};letter-spacing:1px;">${c.tierNome}</div>
            <div style="width:100%;height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;margin-top:2px;">
              <div style="width:${c.pct}%;height:100%;background:${c.tierCor};border-radius:2px;box-shadow:0 0 6px ${c.tierCor};"></div>
            </div>
            <div style="font-family:'Exo 2',sans-serif;font-size:8px;color:rgba(248,250,252,0.4);margin-top:1px;">${c.progLabel}</div>
          </div>`).join('')}
        </div>`
      : `<div style="font-family:'Exo 2',sans-serif;color:rgba(248,250,252,0.3);font-size:12px;padding:8px;">🌱 Iniciando jornada</div>`;

    return htmlConquistas + renderTitulos(titulos);
  }

  const container=document.getElementById('batalhaContainer');
  container.innerHTML=`
<div style="padding:0 12px 60px;max-width:1100px;margin:0 auto;font-family:'Rajdhani',sans-serif;">

<!-- SEASON PASS HEADER -->
<div style="text-align:center;padding:16px 0 24px;">
  <div style="font-family:'Exo 2',sans-serif;font-size:10px;letter-spacing:6px;color:rgba(168,85,247,0.6);text-transform:uppercase;margin-bottom:6px;">⚔️ Battle of Readers</div>
  <div style="font-family:'Orbitron',sans-serif;font-size:clamp(24px,5vw,40px);font-weight:900;background:linear-gradient(135deg,#A855F7,#F8FAFC,#FB923C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1;letter-spacing:4px;">BATALHA DE LEITORES</div>
  <div style="display:inline-block;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.25);border-radius:20px;padding:5px 20px;font-family:'Orbitron',sans-serif;font-size:10px;color:rgba(248,250,252,0.6);letter-spacing:3px;margin-top:8px;">⚔️ ${anoFiltro === 'total' ? 'TODOS OS ANOS' : 'SEASON ' + anoFiltro}</div>
</div>

<!-- HERO VS -->
<div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;margin-bottom:20px;">
  <div style="background:linear-gradient(135deg,rgba(168,85,247,0.12),rgba(15,23,42,0.8));border:1px solid rgba(168,85,247,0.35);border-radius:16px;padding:20px;text-align:center;box-shadow:0 0 30px rgba(168,85,247,0.15);">
    ${avatar('#A855F7','⚔️')}
    <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;color:#A855F7;margin:10px 0 3px;letter-spacing:3px;text-shadow:0 0 20px rgba(168,85,247,0.5);">${pA.toUpperCase()}</div>
    <div style="font-family:'Rajdhani',sans-serif;font-size:12px;color:rgba(248,250,252,0.55);letter-spacing:2px;">${rankTitle(dA)}</div>
    <div style="font-family:'Orbitron',sans-serif;font-size:26px;font-weight:900;color:#F8FAFC;margin:12px 0 2px;text-shadow:0 0 15px rgba(168,85,247,0.4);">${Math.round(poderA).toLocaleString('pt-BR')}</div>
    <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:3px;text-transform:uppercase;">Poder de Leitura</div>
  </div>
  <div style="text-align:center;">
    <div style="font-family:'Orbitron',sans-serif;font-size:clamp(32px,6vw,52px);font-weight:900;background:linear-gradient(180deg,#F8FAFC,rgba(248,250,252,0.3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;">VS</div>
  </div>
  <div style="background:linear-gradient(135deg,rgba(249,115,22,0.12),rgba(15,23,42,0.8));border:1px solid rgba(249,115,22,0.35);border-radius:16px;padding:20px;text-align:center;box-shadow:0 0 30px rgba(249,115,22,0.15);">
    ${avatar('#FB923C','🛡️')}
    <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;color:#FB923C;margin:10px 0 3px;letter-spacing:3px;text-shadow:0 0 20px rgba(249,115,22,0.5);">${pB.toUpperCase()}</div>
    <div style="font-family:'Rajdhani',sans-serif;font-size:12px;color:rgba(248,250,252,0.55);letter-spacing:2px;">${rankTitle(dB)}</div>
    <div style="font-family:'Orbitron',sans-serif;font-size:26px;font-weight:900;color:#F8FAFC;margin:12px 0 2px;text-shadow:0 0 15px rgba(249,115,22,0.4);">${Math.round(poderB).toLocaleString('pt-BR')}</div>
    <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:3px;text-transform:uppercase;">Poder de Leitura</div>
  </div>
</div>

<!-- BARRA DE PODER -->
<div style="margin-bottom:20px;">
  <div style="height:36px;background:rgba(15,23,42,0.8);border-radius:18px;overflow:hidden;display:flex;border:1px solid rgba(255,255,255,0.07);">
    <div style="width:${pctA}%;background:linear-gradient(90deg,#6D28D9,#A855F7);display:flex;align-items:center;padding:0 14px;font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;color:white;letter-spacing:1px;transition:width 1s;">${pctA}%</div>
    <div style="flex:1;background:linear-gradient(90deg,#FB923C,#EA580C);display:flex;align-items:center;justify-content:flex-end;padding:0 14px;font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;color:white;letter-spacing:1px;">${pctB}%</div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:6px;">
    <span style="font-family:'Rajdhani',sans-serif;font-size:12px;color:#A855F7;font-weight:700;">${pA}</span>
    <span style="font-family:'Exo 2',sans-serif;font-size:10px;color:rgba(248,250,252,0.4);letter-spacing:2px;text-transform:uppercase;">⚡ Poder de Leitura Total</span>
    <span style="font-family:'Rajdhani',sans-serif;font-size:12px;color:#FB923C;font-weight:700;">${pB}</span>
  </div>
</div>

<!-- VITÓRIAS MENSAIS -->
<div style="display:flex;gap:10px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;">
  <div style="padding:12px 24px;border-radius:14px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);text-align:center;box-shadow:0 0 16px rgba(168,85,247,0.1);">
    <div style="font-family:'Orbitron',sans-serif;font-size:28px;font-weight:900;color:#A855F7;text-shadow:0 0 16px rgba(168,85,247,0.5);">${vitA}</div>
    <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:2px;text-transform:uppercase;">Vitórias ${pA}</div>
  </div>
  <div style="padding:12px 24px;border-radius:14px;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.07);text-align:center;">
    <div style="font-family:'Orbitron',sans-serif;font-size:28px;font-weight:900;color:rgba(248,250,252,0.3);">${emp}</div>
    <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.3);letter-spacing:2px;text-transform:uppercase;">Empates</div>
  </div>
  <div style="padding:12px 24px;border-radius:14px;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);text-align:center;box-shadow:0 0 16px rgba(249,115,22,0.1);">
    <div style="font-family:'Orbitron',sans-serif;font-size:28px;font-weight:900;color:#FB923C;text-shadow:0 0 16px rgba(249,115,22,0.5);">${vitB}</div>
    <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:2px;text-transform:uppercase;">Vitórias ${pB}</div>
  </div>
</div>

<!-- ATRIBUTOS -->
<div class="bat-section-hdr">⚡ ATRIBUTOS DE COMBATE</div>
<div id="bat-attrs" data-desktop-grid="1" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;"></div>

<!-- PERFIL + GUERRA + DIA SAGRADO -->
<div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
  <div>
    <div class="bat-section-hdr">🕸️ PERFIL DE COMBATE</div>
    <div style="font-family:'Exo 2',sans-serif;font-size:10px;color:rgba(248,250,252,0.35);margin-bottom:10px;">Tetos fixos — escala 0 a 10</div>
    <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;">
      <div style="display:flex;align-items:center;justify-content:center;">
        <canvas id="bat-radar" width="260" height="260"></canvas>
      </div>
      <div id="bat-radar-scores" data-desktop-grid="1" style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div>
      <div class="bat-section-hdr">📈 GUERRA DAS TEMPORADAS</div>
      <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;">
        <div style="height:180px;"><canvas id="bat-linha"></canvas></div>
        <div style="display:flex;justify-content:space-around;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="text-align:center;">
            <div style="font-family:'Orbitron',sans-serif;font-size:20px;font-weight:900;color:#A855F7;">${vitA}</div>
            <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);">${pA} venceu</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:'Orbitron',sans-serif;font-size:20px;font-weight:900;color:rgba(248,250,252,0.3);">${emp}</div>
            <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.3);">empates</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:'Orbitron',sans-serif;font-size:20px;font-weight:900;color:#FB923C;">${vitB}</div>
            <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);">${pB} venceu</div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="bat-section-hdr">📅 DIA SAGRADO</div>
      <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;">
        <div style="height:130px;"><canvas id="bat-wd"></canvas></div>
        <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="text-align:center;">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;color:#A855F7;font-weight:700;">${pA.toUpperCase()}</div>
            <div id="bat-wd-dia-a" style="font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:#F8FAFC;"></div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;color:#FB923C;font-weight:700;">${pB.toUpperCase()}</div>
            <div id="bat-wd-dia-b" style="font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:#F8FAFC;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- DIAS LIDOS NO PERÍODO -->
<div style="margin-bottom:20px;">
  <div class="bat-section-hdr">📆 DIAS LIDOS NO PERÍODO</div>
  <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;">
    <div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">
      <div style="text-align:center;">
        <div style="font-family:'Orbitron',sans-serif;font-size:48px;font-weight:900;color:#A855F7;text-shadow:0 0 20px rgba(168,85,247,0.5);line-height:1;">${dA.diasSet.size}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:13px;color:#A855F7;letter-spacing:2px;margin-top:4px;">${pA.toUpperCase()}</div>
        <div style="font-family:'Exo 2',sans-serif;font-size:11px;color:rgba(248,250,252,0.4);margin-top:2px;">dias com leitura</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:'Orbitron',sans-serif;font-size:48px;font-weight:900;color:#FB923C;text-shadow:0 0 20px rgba(249,115,22,0.5);line-height:1;">${dB.diasSet.size}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:13px;color:#FB923C;letter-spacing:2px;margin-top:4px;">${pB.toUpperCase()}</div>
        <div style="font-family:'Exo 2',sans-serif;font-size:11px;color:rgba(248,250,252,0.4);margin-top:2px;">dias com leitura</div>
      </div>
    </div>
    <div style="margin-top:16px;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;">
      ${(()=>{
        const tot = dA.diasSet.size + dB.diasSet.size || 1;
        const pctA = Math.round(dA.diasSet.size/tot*100);
        return `<div style="height:100%;background:linear-gradient(90deg,#A855F7,rgba(168,85,247,0.5));width:${pctA}%;float:left;border-radius:4px 0 0 4px;"></div>
                <div style="height:100%;background:linear-gradient(90deg,rgba(249,115,22,0.5),#FB923C);width:${100-pctA}%;float:left;border-radius:0 4px 4px 0;"></div>`;
      })()}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:6px;">
      <span style="font-family:'Exo 2',sans-serif;font-size:10px;color:#A855F7;">${Math.round(dA.diasSet.size/(dA.diasSet.size+dB.diasSet.size||1)*100)}%</span>
      <span style="font-family:'Exo 2',sans-serif;font-size:10px;color:rgba(248,250,252,0.3);">distribuição de dias</span>
      <span style="font-family:'Exo 2',sans-serif;font-size:10px;color:#FB923C;">${Math.round(dB.diasSet.size/(dA.diasSet.size+dB.diasSet.size||1)*100)}%</span>
    </div>
  </div>
</div>

<!-- COMPETIÇÃO POR GÊNEROS — full width -->
<div style="margin-bottom:20px;">
  <div class="bat-section-hdr">🌎 COMPETIÇÃO POR GÊNEROS</div>
  <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;">
    <div style="height:360px;"><canvas id="bat-generos"></canvas></div>
    <div id="bat-generos-vazio" style="display:none;font-family:'Exo 2',sans-serif;font-size:11px;color:rgba(248,250,252,0.3);text-align:center;padding:20px;">Adicione gêneros via ✏️ Atualizar Livro</div>
  </div>
</div>

<!-- BOSSES + SLIMES — 2 colunas simétricas -->
<div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
  <div>
    <div class="bat-section-hdr">💀 BOSSES DERROTADOS (1000+ págs)</div>
    <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;">
      <div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:#A855F7;margin-bottom:8px;letter-spacing:1px;">${pA.toUpperCase()} · ${dA.bosses.length}</div>
          <div id="bat-boss-a"></div>
        </div>
        <div>
          <div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:#FB923C;margin-bottom:8px;letter-spacing:1px;">${pB.toUpperCase()} · ${dB.bosses.length}</div>
          <div id="bat-boss-b"></div>
        </div>
      </div>
    </div>
  </div>
  <div>
    <div class="bat-section-hdr">🐛 VENCENDO SLIMES (até 200 págs)</div>
    <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;">
      <div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="bat-slimes"></div>
    </div>
  </div>
</div>

<!-- ARTEFATOS + MALDIÇÕES -->
<div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
  <div>
    <div class="bat-section-hdr">⭐ ARTEFATOS LENDÁRIOS — MELHORES AVALIADOS</div>
    <div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;overflow:visible;" id="bat-artefatos">
      <div><div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:#A855F7;margin-bottom:8px;letter-spacing:2px;">${pA.toUpperCase()}</div></div>
      <div><div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:#FB923C;margin-bottom:8px;letter-spacing:2px;">${pB.toUpperCase()}</div></div>
    </div>
  </div>
  <div>
    <div class="bat-section-hdr">💀 MALDIÇÕES — PIORES AVALIADOS</div>
    <div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;overflow:visible;" id="bat-maldicoes">
      <div><div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:#A855F7;margin-bottom:8px;letter-spacing:2px;">${pA.toUpperCase()}</div></div>
      <div><div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:#FB923C;margin-bottom:8px;letter-spacing:2px;">${pB.toUpperCase()}</div></div>
    </div>
  </div>
</div>

<!-- AUTOR DOMINADO -->
<div style="margin-bottom:20px;">
  <div class="bat-section-hdr">📚 AUTOR DOMINADO</div>
  <div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    ${[{p:pA,dd:dA,cor:'#A855F7'},{p:pB,dd:dB,cor:'#FB923C'}].map(({p,dd,cor})=>`
    <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;">
      <div style="width:44px;height:44px;border-radius:50%;background:${cor}22;border:2px solid ${cor};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;box-shadow:0 0 12px ${cor}44;">📖</div>
      <div>
        <div style="font-family:'Orbitron',sans-serif;font-size:9px;color:${cor};font-weight:700;letter-spacing:2px;">${p.toUpperCase()}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#F8FAFC;">${dd.autorTop?.[0]||'—'}</div>
        <div style="font-family:'Exo 2',sans-serif;font-size:11px;color:rgba(248,250,252,0.4);">${(dd.autorTop?.[1]||0).toLocaleString('pt-BR')} págs lidas</div>
      </div>
    </div>`).join('')}
  </div>
</div>

<!-- CONQUISTAS — separadas por player, cada um full-width -->
<div style="margin-bottom:20px;">
  <div class="bat-section-hdr">🏅 CONQUISTAS & FEITOS</div>
  <div style="display:flex;flex-direction:column;gap:12px;">
    ${[{p:pA,dd:dA,cor:'#A855F7',ts:titulosA},{p:pB,dd:dB,cor:'#FB923C',ts:titulosB}].map(({p,dd,cor,ts})=>`
    <div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid ${cor}44;border-left:4px solid ${cor};border-radius:14px;padding:16px;box-shadow:0 0 24px ${cor}11;">
      <div style="font-family:'Orbitron',sans-serif;font-size:10px;color:${cor};font-weight:900;margin-bottom:16px;letter-spacing:3px;text-shadow:0 0 10px ${cor}66;">⚔️ ${p.toUpperCase()}</div>
      ${medalhas(dd, ts)}
    </div>`).join('')}
  </div>
  <div style="text-align:center;margin-top:16px;">
    <button onclick="document.getElementById('modal-todas-conquistas').style.display='flex'" style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.4);border-radius:20px;padding:10px 24px;font-family:'Orbitron',sans-serif;font-size:10px;color:#A855F7;letter-spacing:2px;cursor:pointer;transition:all .2s;" onmouseover="this.style.background='rgba(168,85,247,0.22)'" onmouseout="this.style.background='rgba(168,85,247,0.12)'">📋 VER TODAS AS CONQUISTAS</button>
  </div>
</div>

<!-- MODAL TODAS AS CONQUISTAS -->
<div id="modal-todas-conquistas" onclick="if(event.target===this)this.style.display='none'" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;">
  <div style="background:#0B1020;border:1px solid rgba(168,85,247,0.3);border-radius:18px;padding:20px;max-width:500px;width:100%;margin:auto;position:relative;">
    <button onclick="document.getElementById('modal-todas-conquistas').style.display='none'" style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.07);border:none;border-radius:50%;width:28px;height:28px;font-size:14px;color:#F8FAFC;cursor:pointer;line-height:28px;text-align:center;">✕</button>
    <div style="font-family:'Orbitron',sans-serif;font-size:12px;font-weight:900;color:#A855F7;letter-spacing:3px;margin-bottom:20px;text-align:center;">📋 TODAS AS CONQUISTAS</div>

    <div style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:2px;color:rgba(248,250,252,0.4);margin-bottom:10px;">🏅 CONQUISTAS</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px;">
      ${(()=>{
        const lista = [
          {icon:'📖',nome:'Domínio de Páginas',thresholds:[1000,5000,15000,30000,60000,100000]},
          {icon:'📚',nome:'Grimório Completo',thresholds:[5,15,30,50,80,120]},
          {icon:'⏳',nome:'Stamina Total',thresholds:[50,150,300,500,800,1200]},
          {icon:'🔥',nome:'Combo de Leitura',thresholds:[7,14,30,60,100,180]},
          {icon:'⚡',nome:'Velocidade',thresholds:[10,30,50,80,120,200]},
          {icon:'📅',nome:'Sessões de Treino',thresholds:[20,80,200,400,700,1000]},
          {icon:'🧠',nome:'Crítico Literário',thresholds:[5,6,7,7.5,8,9]},
          {icon:'💀',nome:'Boss Slayer',thresholds:[1,5,10,20,35,50]},
          {icon:'🏛️',nome:'Explorador de Reinos',thresholds:[3,8,15,25,40,60]},
          {icon:'✍️',nome:'Colecionador',thresholds:[5,15,30,50,80,120]},
          {icon:'🏆',nome:'Senhor das Séries',thresholds:[1,3,5,8,12,20]},
          {icon:'🌎',nome:'Mestre dos Gêneros',thresholds:[2,4,6,8,10,12]},
        ];
        const tiers=[{n:'Bronze',c:'#cd7f32'},{n:'Prata',c:'#c0c0c0'},{n:'Ouro',c:'#ffd700'},{n:'Platina',c:'#4ade80'},{n:'Diamante',c:'#38bdf8'},{n:'Mestre',c:'#c084fc'}];
        const getValA=(nome)=>{const m={'Domínio de Páginas':dA.pagTotal,'Grimório Completo':dA.lidos.length,'Stamina Total':dA.horas,'Combo de Leitura':dA.streakRecord,'Velocidade':Math.round(dA.media),'Sessões de Treino':dA.sessoes,'Crítico Literário':dA.notaMedia||0,'Boss Slayer':dA.bosses.length,'Explorador de Reinos':dA.colSet.size,'Colecionador':Object.keys(dA.autMap||{}).length,'Senhor das Séries':dA.seriesConcluidas||0,'Mestre dos Gêneros':dA.generosSet?.size||0};return m[nome]??0;};
        const getValB=(nome)=>{const m={'Domínio de Páginas':dB.pagTotal,'Grimório Completo':dB.lidos.length,'Stamina Total':dB.horas,'Combo de Leitura':dB.streakRecord,'Velocidade':Math.round(dB.media),'Sessões de Treino':dB.sessoes,'Crítico Literário':dB.notaMedia||0,'Boss Slayer':dB.bosses.length,'Explorador de Reinos':dB.colSet.size,'Colecionador':Object.keys(dB.autMap||{}).length,'Senhor das Séries':dB.seriesConcluidas||0,'Mestre dos Gêneros':dB.generosSet?.size||0};return m[nome]??0;};
        return lista.map(({icon,nome,thresholds})=>{
          const vA=getValA(nome),vB=getValB(nome);
          const getTier=(v)=>{let t=-1;thresholds.forEach((th,i)=>{if(v>=th)t=i;});return t;};
          const tA=getTier(vA),tB=getTier(vB);
          const nenhum=tA<0&&tB<0;
          const labelA=tA>=0?tiers[tA].n:'—',labelB=tB>=0?tiers[tB].n:'—';
          const corA=tA>=0?tiers[tA].c:'rgba(255,255,255,0.15)',corB=tB>=0?tiers[tB].c:'rgba(255,255,255,0.15)';
          const bg=nenhum?'rgba(255,255,255,0.01)':'rgba(255,255,255,0.03)';
          const iconOpacity=nenhum?'opacity:0.3;':'';
          return `<div style="display:grid;grid-template-columns:24px 1fr 72px 72px;align-items:center;gap:8px;padding:7px 10px;background:${bg};border-radius:8px;${nenhum?'border:1px solid rgba(255,255,255,0.04);':''}">
            <span style="font-size:16px;${iconOpacity}">${icon}</span>
            <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;color:${nenhum?'rgba(248,250,252,0.3)':'#F8FAFC'};">${nome}</div>
            <div style="text-align:center;"><span style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:${corA};">${labelA}</span><div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.25);">${pA}</div></div>
            <div style="text-align:center;"><span style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:${corB};">${labelB}</span><div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.25);">${pB}</div></div>
          </div>`;
        }).join('');
      })()}
    </div>

    <div style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:2px;color:rgba(250,204,21,0.7);margin-bottom:10px;">✨ TÍTULOS EXCLUSIVOS</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${(()=>{
        const todosT=[
          {icon:'👑',nome:'Rei das Páginas',valA:dA.pagTotal,valB:dB.pagTotal},
          {icon:'🏛️',nome:'Imperador da Biblioteca',valA:dA.lidos.length,valB:dB.lidos.length},
          {icon:'⏳',nome:'Senhor do Tempo',valA:dA.horas,valB:dB.horas},
          {icon:'🔥',nome:'Combo Supremo',valA:dA.streakRecord,valB:dB.streakRecord},
          {icon:'🧠',nome:'Crítico Supremo',valA:dA.notaMedia||0,valB:dB.notaMedia||0},
          {icon:'⚡',nome:'Leitor Relâmpago',valA:Math.round(dA.media),valB:Math.round(dB.media)},
          {icon:'💀',nome:'Boss Slayer',valA:dA.bosses.length,valB:dB.bosses.length},
          {icon:'📅',nome:'Dominador das Sessões',valA:dA.sessoes,valB:dB.sessoes},
          {icon:'🏆',nome:'Senhor das Séries',valA:dA.seriesConcluidas||0,valB:dB.seriesConcluidas||0},
          {icon:'🌎',nome:'Explorador Supremo',valA:Object.keys(dA.autMap||{}).length,valB:Object.keys(dB.autMap||{}).length},
          {icon:'🛡️',nome:'Monarca da Consistência',valA:dA.diasSet?.size||0,valB:dB.diasSet?.size||0},
          {icon:'🐛',nome:'Mestre dos Slimes',valA:dA.lidos.filter(l=>l.totalPag>0&&l.totalPag<=200).length,valB:dB.lidos.filter(l=>l.totalPag>0&&l.totalPag<=200).length},
        ];
        return todosT.map(({icon,nome,valA,valB})=>{
          const dono=valA===0&&valB===0?'nenhum':valA>valB?pA:valB>valA?pB:'empate';
          const cor=dono===pA?'#A855F7':dono===pB?'#FB923C':dono==='empate'?'rgba(248,250,252,0.4)':'rgba(248,250,252,0.15)';
          const label=dono==='nenhum'?'⬜ Nenhum ainda':dono==='empate'?'🤝 Empate':'🏆 '+dono;
          const bg=dono==='nenhum'?'rgba(250,204,21,0.02)':'rgba(250,204,21,0.04)';
          const opacity=dono==='nenhum'?'opacity:0.4;':'';
          return `<div style="display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:8px;padding:7px 10px;background:${bg};border:1px solid rgba(250,204,21,0.08);border-radius:8px;">
            <span style="font-size:16px;${opacity}">${icon}</span>
            <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;color:${dono==='nenhum'?'rgba(248,250,252,0.3)':'#F8FAFC'};">${nome}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:${cor};text-align:right;">${label}</div>
          </div>`;
        }).join('');
      })()}
    </div>
  </div>
</div>



<!-- CRÔNICAS DA GUERRA -->
<div class="bat-section-hdr">📜 CRÔNICAS DA GUERRA — HISTÓRICO DA RIVALIDADE</div>
<div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;margin-bottom:20px;">
  <div data-desktop-grid="1" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:20px;align-items:center;">
    <div style="text-align:center;">
      <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">MESES VENCIDOS</div>
      <div style="display:flex;justify-content:center;align-items:center;gap:16px;">
        <div>
          <div style="font-family:'Orbitron',sans-serif;font-size:36px;font-weight:900;color:#A855F7;text-shadow:0 0 20px rgba(168,85,247,0.5);">${vitA}</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:10px;color:#A855F7;letter-spacing:1px;">${pA.toUpperCase()}</div>
        </div>
        <div style="font-size:16px;color:rgba(255,255,255,0.1);">⚔️</div>
        <div>
          <div style="font-family:'Orbitron',sans-serif;font-size:36px;font-weight:900;color:#FB923C;text-shadow:0 0 20px rgba(249,115,22,0.5);">${vitB}</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:10px;color:#FB923C;letter-spacing:1px;">${pB.toUpperCase()}</div>
        </div>
      </div>
    </div>
    <div style="text-align:center;">
      <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">EMPATES</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:36px;font-weight:900;color:rgba(248,250,252,0.3);">${emp}</div>
      <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.3);margin-top:4px;">de ${vitA+vitB+emp} meses</div>
    </div>
    <div style="text-align:center;">
      <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">LIDERANÇA</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:16px;font-weight:900;color:${vitA>vitB?'#A855F7':vitB>vitA?'#FB923C':'rgba(248,250,252,0.4)'};">
        ${vitA>vitB?'🏆 '+pA.toUpperCase():vitB>vitA?'🏆 '+pB.toUpperCase():'🤝 EMPATE'}
      </div>
      <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.3);margin-top:4px;">diferença: ${Math.abs(vitA-vitB)} meses</div>
    </div>
    <div style="border-left:1px solid rgba(255,255,255,0.07);padding-left:20px;">
      <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">⚔️ RIVALIDADE DESDE</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:20px;font-weight:900;color:#F8FAFC;line-height:1.2;">
        ${(()=>{const allM=[...Object.keys(dA.mesPags),...Object.keys(dB.mesPags)].sort();if(!allM.length)return'—';const[y,m]=allM[0].split('-');return ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][parseInt(m)-1]+'<br><span style="font-size:13px;color:rgba(248,250,252,0.4)">DE '+y+'</span>';})()}
      </div>
    </div>
  </div>
</div>

<div style="text-align:center;margin-top:32px;font-family:'Exo 2',sans-serif;font-size:11px;color:rgba(248,250,252,0.2);font-style:italic;letter-spacing:2px;">"Leitura não é uma competição. Mas que vença o melhor leitor."</div>

</div>`;
  // Atributos
  const attrs=[
    {title:'DOMÍNIO DE PÁGINAS',icon:'📄',vA:dA.pagTotal,vB:dB.pagTotal,fmt:v=>v.toLocaleString('pt-BR'),sub:'páginas lidas'},
    {title:'GRIMÓRIO COMPLETO',icon:'✅',vA:dA.lidos.length,vB:dB.lidos.length,fmt:v=>v,sub:'livros concluídos'},
    {title:'STAMINA',icon:'🕐',vA:dA.horas,vB:dB.horas,fmt:v=>v+'h',sub:'horas lidas'},
    {title:'COMBO',icon:'🔥',vA:dA.streakAtual,vB:dB.streakAtual,fmt:v=>v+' dias',sub:'streak atual'},
    {title:'VELOCIDADE',icon:'⚡',vA:dA.media,vB:dB.media,fmt:v=>v,sub:'págs/dia média'},
    {title:'CRÍTICO',icon:'⭐',vA:dA.notaMedia,vB:dB.notaMedia,fmt:(v,dd)=>dd.notaMedia!==null?dd.notaMedia.toFixed(1):'—',sub:'nota média'},
    {title:'SESSÕES',icon:'📖',vA:dA.sessoes,vB:dB.sessoes,fmt:v=>v,sub:'sessões registradas'},
    {title:'EFICIÊNCIA',icon:'💨',vA:dA.eficiencia,vB:dB.eficiencia,fmt:v=>v,sub:'págs/hora'},
  ];
  document.getElementById('bat-attrs').innerHTML=attrs.map(a=>{
    const vA=a.vA??-1, vB=a.vB??-1;
    const mx=Math.max(Math.abs(vA<0?0:vA),Math.abs(vB<0?0:vB),1);
    const pA2=vA>=0?Math.round(vA/mx*100):0, pB2=vB>=0?Math.round(vB/mx*100):0;
    const winA=vA>=0&&vB>=0&&vA-vB>0.05, winB=vA>=0&&vB>=0&&vB-vA>0.05;
    const empate=vA>=0&&vB>=0&&!winA&&!winB;
    const fmtA=a.fmt.length>1?a.fmt(vA,dA):a.fmt(vA);
    const fmtB=a.fmt.length>1?a.fmt(vB,dB):a.fmt(vB);
    return `<div style="background:rgba(15,23,42,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;position:relative;">
      ${winA?`<div style="position:absolute;top:8px;right:8px;font-size:14px;filter:drop-shadow(0 0 6px #FACC15);">🏆</div>`:winB?`<div style="position:absolute;top:8px;right:8px;font-size:14px;filter:drop-shadow(0 0 6px #FACC15);">🏆</div>`:empate?`<div style="position:absolute;top:8px;right:8px;font-size:14px;">🤝</div>`:''}
      <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2px;color:rgba(248,250,252,0.4);margin-bottom:10px;text-transform:uppercase;">${a.icon} ${a.title}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:#A855F7;">${pA}</span>
        <span style="font-family:'Orbitron',sans-serif;font-size:15px;font-weight:700;color:${winA?'#A855F7':'rgba(248,250,252,0.4)'};">${fmtA}</span>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-bottom:8px;"><div style="width:${pA2}%;height:100%;background:#A855F7;border-radius:2px;box-shadow:0 0 8px rgba(168,85,247,0.5);"></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:#FB923C;">${pB}</span>
        <span style="font-family:'Orbitron',sans-serif;font-size:15px;font-weight:700;color:${winB?'#FB923C':'rgba(248,250,252,0.4)'};">${fmtB}</span>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-bottom:8px;"><div style="width:${pB2}%;height:100%;background:#FB923C;border-radius:2px;box-shadow:0 0 8px rgba(249,115,22,0.5);"></div></div>
      <div style="font-family:'Exo 2',sans-serif;font-size:10px;color:rgba(248,250,252,0.35);font-weight:500;">${a.sub}</div>
    </div>`;
  }).join('');

  // Artefatos com capa
  function artefatoCard(dd,cor,tipo){
    const nota=tipo==='melhor'?[...dd.notas].sort((a,b)=>b.media-a.media)[0]:[...dd.notas].sort((a,b)=>a.media-b.media)[0];
    if(!nota)return`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;color:var(--muted);font-size:12px;text-align:center;">Sem avaliações</div>`;
    const allLivros=[...(window._dadosD?.livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
    const livro=allLivros.find(l=>l.livro===nota.livro);
    const uid='art-'+Math.random().toString(36).slice(2,8);
    const rankNum=[...dd.notas].sort((a,b)=>tipo==='melhor'?b.media-a.media:a.media-b.media).findIndex(n=>n.livro===nota.livro)+1;
    const rankCol=rankNum===1?'#ffd700':rankNum===2?'#c0c0c0':'#cd7f32';
    const estrela=tipo==='melhor'?'⭐':'💀';
    const html=`<div class="bat-art-card" style="border:1px solid ${cor}44;">
      <div class="bat-art-capa" id="${uid}-wrap">
        <div class="bat-art-rank" style="background:${rankCol};color:#000;">${rankNum}</div>
        <div id="${uid}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:48px;background:linear-gradient(160deg,var(--bg3),#0d1020);">${estrela}</div>
      </div>
      <div class="bat-art-overlay">
        <div style="font-size:11px;color:${cor};font-weight:700;letter-spacing:1px;">${dd.u.toUpperCase()}</div>
        <div style="font-size:15px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:2px 0;">${nota.livro}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.75);">${estrela} ${nota.media.toFixed(1)} · ${nota.ano||'—'}</div>
      </div>
    </div>`;
    if(livro?.coverUrl||livro?.isbn){
      setTimeout(()=>{
        const el=document.getElementById(uid);
        if(!el)return;
        const img=document.createElement('img');
        img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
        img.onerror=()=>{};
        img.src=livro.coverUrl||(livro.isbn?`https://covers.openlibrary.org/b/isbn/${livro.isbn}-M.jpg`:'');
        if(img.src){el.innerHTML='';el.appendChild(img);}
      },150);
    }
    return html;
  }

  // Render artefatos — injeta dentro do segundo filho de cada coluna
  function renderArtefatos(containerId, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cols = container.querySelectorAll(':scope > div');
    [dA, dB].forEach((dd, i) => {
      const col = cols[i];
      if (!col) return;
      // mantém o header, adiciona o card abaixo
      const card = document.createElement('div');
      card.innerHTML = artefatoCard(dd, i===0?CA:CB, tipo);
      col.appendChild(card.firstChild || card);
    });
  }
  renderArtefatos('bat-artefatos', 'melhor');
  renderArtefatos('bat-maldicoes', 'pior');

  // Render bosses com capa e zoom
  function bossCard(dd,cor){
    const allLivros=[...(window._dadosD?.livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
    const lista=dd.bosses.sort((a,b)=>b.totalPag-a.totalPag).slice(0,3);
    if(!lista.length)return`<div style="color:var(--muted);font-size:12px;padding:8px 0;">Nenhum boss ainda</div>`;
    return lista.map(b=>{
      const l=allLivros.find(x=>x.livro===b.livro);
      const uid='bs-'+Math.random().toString(36).slice(2,8);
      setTimeout(()=>{const el=document.getElementById(uid);if(!el)return;const src=l?.coverUrl||(l?.isbn?`https://covers.openlibrary.org/b/isbn/${l.isbn}-M.jpg`:'');if(src){el.src=src;el.onerror=()=>{el.style.display='none';};};},200);
      return `<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <img id="${uid}" src="" class="bat-boss-cover" alt="">
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">💀 ${b.livro}</div>
          <div style="font-family:'Exo 2',sans-serif;font-size:11px;color:rgba(248,250,252,0.4);">${b.totalPag.toLocaleString('pt-BR')} págs</div>
        </div>
      </div>`;
    }).join('');
  }

  function slimeCard(dd,cor){
    const allLivros=[...(window._dadosD?.livros||[]),...(window._dadosD?.lendo||[]),...(window._dadosD?.pausados||[]),...(window._dadosD?.aguardando||[])];
    const slimes=dd.lidos.filter(l=>l.totalPag>0&&l.totalPag<=200).sort((a,b)=>a.totalPag-b.totalPag);
    const header=`<div style="font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;color:${cor};margin-bottom:8px;letter-spacing:1px;">${dd.u.toUpperCase()} · ${slimes.length} slimes</div>`;
    if(!slimes.length)return header+`<div style="font-family:'Exo 2',sans-serif;color:rgba(248,250,252,0.3);font-size:12px;padding:8px 0;">Nenhum slime vencido</div>`;
    return header+slimes.slice(0,3).map(b=>{
      const l=allLivros.find(x=>x.livro===b.livro);
      const uid='sl-'+Math.random().toString(36).slice(2,8);
      setTimeout(()=>{const el=document.getElementById(uid);if(!el)return;const src=l?.coverUrl||(l?.isbn?`https://covers.openlibrary.org/b/isbn/${l.isbn}-M.jpg`:'');if(src){el.src=src;el.onerror=()=>{el.style.display='none';};};},250);
      return `<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <img id="${uid}" src="" class="bat-boss-cover" alt="">
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🐛 ${b.livro}</div>
          <div style="font-family:'Exo 2',sans-serif;font-size:11px;color:rgba(248,250,252,0.4);">${b.totalPag} págs</div>
        </div>
      </div>`;
    }).join('');
  }

  document.getElementById('bat-boss-a').innerHTML=bossCard(dA,CA);
  document.getElementById('bat-boss-b').innerHTML=bossCard(dB,CB);
  document.getElementById('bat-slimes').innerHTML=
    `<div>${slimeCard(dA,CA)}</div><div>${slimeCard(dB,CB)}</div>`;

    // Dia favorito
  const wdNomes2=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  document.getElementById('bat-wd-dia-a').textContent=wdNomes2[dA.wdMap.indexOf(Math.max(...dA.wdMap))];
  document.getElementById('bat-wd-dia-b').textContent=wdNomes2[dB.wdMap.indexOf(Math.max(...dB.wdMap))];

  // Charts
  requestAnimationFrame(()=>{
    // Radar
    const rEl=document.getElementById('bat-radar');
    if(rEl){const ex=Chart.getChart(rEl);if(ex)ex.destroy();
    new Chart(rEl,{type:'radar',
      data:{
        labels:['Volume','Consistência','Velocidade','Qualidade','Resistência','Variedade'],
        datasets:[
          {label:pA,data:radarA,borderColor:CA,backgroundColor:CA+'22',
           pointBackgroundColor:CA,pointBorderColor:CA,pointHoverBackgroundColor:'#fff',
           pointRadius:4,pointHoverRadius:6,borderWidth:2.5},
          {label:pB,data:radarB,borderColor:CB,backgroundColor:CB+'22',
           pointBackgroundColor:CB,pointBorderColor:CB,pointHoverBackgroundColor:'#fff',
           pointRadius:4,pointHoverRadius:6,borderWidth:2.5}
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:true,
        scales:{r:{
          min:0,max:10,
          ticks:{display:true,stepSize:2,color:'rgba(255,255,255,0.25)',font:{size:9},backdropColor:'transparent'},
          grid:{color:'rgba(255,255,255,0.06)'},
          angleLines:{color:'rgba(255,255,255,0.06)'},
          pointLabels:{color:'#c0c8d8',font:{size:12,weight:'600'}}
        }},
        plugins:{
          legend:{labels:{color:'#8892a8',font:{size:12},padding:16}},
          tooltip:{
            ...(window.TT||{}),
            callbacks:{
              label:c=>{
                const ddX = c.dataset.label===pA ? dA : dB;
                const anosX = anoFiltro==='total' ? anosAtivos(ddX) : 1;
                const explica=[
                  `págs/${(TETOS_BASE.paginas*anosX).toLocaleString('pt-BR')} meta`,
                  `${ddX.diasSet.size} dias lidos/${calcDiasPeriodo(ddX)} do período`,
                  `${Math.round(ddX.pagTotal/(ddX.diasSet.size||1))} págs/dia lido`,
                  `nota média ${(ddX.notaMedia||0).toFixed(1)}`,
                  `${ddX.bosses.length} bosses / ${TETOS_BASE.bosses*anosX} meta`,
                  `autores+gêneros / ${TETOS_BASE.variedade*anosX} meta`
                ];
                return ` ${c.dataset.label}: ${c.parsed.r.toFixed(1)}/10 — ${explica[c.dataIndex]}`;
              }
            }
          }
        }
      }
    });}

    // Scores grid
    const scoresEl = document.getElementById('bat-radar-scores');
    if (scoresEl) {
      const labels = ['Volume','Consistência','Velocidade','Qualidade','Resistência','Variedade'];
      scoresEl.innerHTML = labels.map((l,i) => `
        <div style="text-align:center;padding:4px;background:rgba(255,255,255,0.03);border-radius:6px;">
          <div style="font-family:'Exo 2',sans-serif;font-size:9px;color:rgba(248,250,252,0.4);margin-bottom:3px;">${l}</div>
          <div style="display:flex;justify-content:center;gap:8px;">
            <span style="font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:#A855F7;">${radarA[i].toFixed(1)}</span>
            <span style="color:rgba(255,255,255,0.2);font-size:11px;">·</span>
            <span style="font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:#FB923C;">${radarB[i].toFixed(1)}</span>
          </div>
        </div>`).join('');
    }
    const lEl=document.getElementById('bat-linha');
    if(lEl){const ex=Chart.getChart(lEl);if(ex)ex.destroy();
    const mA=meses12.map(m=>dA.mesPags[m]||0), mB=meses12.map(m=>dB.mesPags[m]||0);
    new Chart(lEl,{type:'bar',data:{labels:mesesLbl,datasets:[
      {label:pA,data:mA,backgroundColor:CA+'bb',borderColor:CA,borderWidth:1,borderRadius:4},
      {label:pB,data:mB,backgroundColor:CB+'bb',borderColor:CB,borderWidth:1,borderRadius:4}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8892a8',font:{size:11}}},tooltip:{...(window.TT||{}),callbacks:{afterBody:items=>{const i=items[0].dataIndex;const a=mA[i],b=mB[i];if(!a&&!b)return'';return a>b?'🏆 '+pA+' venceu':b>a?'🏆 '+pB+' venceu':'🤝 Empate';}}}},
    scales:{x:{ticks:{color:'#8892a8',font:{size:10}},grid:{color:'rgba(42,50,72,0.4)'}},y:{ticks:{color:'#8892a8',font:{size:10},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v},grid:{color:'rgba(42,50,72,0.4)'},beginAtZero:true}}}});}

    // Gêneros comparativo — estilo barras horizontais com %
    const genEl = document.getElementById('bat-generos');
    if (genEl) {
      const ex = Chart.getChart(genEl); if(ex) ex.destroy();
      const genA = {}, genB = {};
      dA.todos.filter(l=>l.status==='Completo'&&l.genero).forEach(l=>{ genA[l.genero]=(genA[l.genero]||0)+1; });
      dB.todos.filter(l=>l.status==='Completo'&&l.genero).forEach(l=>{ genB[l.genero]=(genB[l.genero]||0)+1; });
      const allGen = [...new Set([...Object.keys(genA),...Object.keys(genB)])].sort((a,b)=>{
        return ((genA[b]||0)+(genB[b]||0)) - ((genA[a]||0)+(genB[a]||0));
      }).slice(0,10); // top 10 gêneros mais lidos entre os dois
      const vaziEl = document.getElementById('bat-generos-vazio');
      if (!allGen.length) {
        genEl.style.display='none';
        if(vaziEl) vaziEl.style.display='block';
      } else {
        if(vaziEl) vaziEl.style.display='none';
        genEl.style.display='block';
        const totA = dA.todos.filter(l=>l.status==='Completo'&&l.genero).length||1;
        const totB = dB.todos.filter(l=>l.status==='Completo'&&l.genero).length||1;
        // Build divergent chart using canvas directly
        genEl.style.display = 'none';
        let divEl = document.getElementById('bat-generos-div');
        if (!divEl) {
          divEl = document.createElement('div');
          divEl.id = 'bat-generos-div';
          genEl.parentElement.insertBefore(divEl, genEl);
        }

        const maxPct = Math.max(...allGen.map(g => Math.max(
          Math.round((genA[g]||0)/totA*100),
          Math.round((genB[g]||0)/totB*100)
        )), 1);

        divEl.innerHTML = `
          <div style="display:flex;justify-content:center;gap:24px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;"><div style="width:14px;height:14px;background:#A855F7;border-radius:2px;"></div><span style="font-family:'Rajdhani',sans-serif;font-size:13px;color:#c0c8d8;">${pA}</span></div>
            <div style="display:flex;align-items:center;gap:8px;"><div style="width:14px;height:14px;background:#FB923C;border-radius:2px;"></div><span style="font-family:'Rajdhani',sans-serif;font-size:13px;color:#c0c8d8;">${pB}</span></div>
          </div>
          ${allGen.map(g => {
            const pctA = Math.round((genA[g]||0)/totA*100);
            const pctB = Math.round((genB[g]||0)/totB*100);
            const wA = Math.round(pctA/maxPct*45);
            const wB = Math.round(pctB/maxPct*45);
            return `
            <div data-desktop-grid="1" style="display:grid;grid-template-columns:140px 1fr 1fr;align-items:center;gap:8px;margin-bottom:10px;">
              <div style="font-family:'Rajdhani',sans-serif;font-size:12px;color:#c0c8d8;text-align:right;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${g}</div>
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">
                <span style="font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:#A855F7;">${pctA}%</span>
                <div style="height:22px;width:${wA}%;background:linear-gradient(90deg,rgba(168,85,247,0.5),#A855F7);border-radius:3px 0 0 3px;min-width:${pctA?2:0}px;"></div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="height:22px;width:${wB}%;background:linear-gradient(90deg,#FB923C,rgba(249,115,22,0.5));border-radius:0 3px 3px 0;min-width:${pctB?2:0}px;"></div>
                <span style="font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:#FB923C;">${pctB}%</span>
              </div>
            </div>`;
          }).join('')}
        `;

      }
    }
    const wEl=document.getElementById('bat-wd');
    if(wEl){const ex=Chart.getChart(wEl);if(ex)ex.destroy();
    new Chart(wEl,{type:'bar',data:{labels:['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],datasets:[
      {label:pA,data:dA.wdMap,backgroundColor:CA+'aa',borderColor:CA,borderWidth:1,borderRadius:4},
      {label:pB,data:dB.wdMap,backgroundColor:CB+'aa',borderColor:CB,borderWidth:1,borderRadius:4}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8892a8',font:{size:11}}},tooltip:{...(window.TT||{})}},
    scales:{x:{ticks:{color:'#8892a8',font:{size:10}},grid:{color:'rgba(42,50,72,0.4)'}},y:{ticks:{color:'#8892a8',font:{size:10}},grid:{color:'rgba(42,50,72,0.4)'},beginAtZero:true}}}});}
  });
}

// ── Mobile View System ───────────────────────────────────────────
let _mobileView = false;
// ── Mobile layout patcher ─────────────────────────────────────────
function applyMobileLayout() {
  if (!isMobile()) return;
  // Tag dynamically created grid elements
  document.querySelectorAll('[style*="grid-template-columns"]').forEach(el => {
    const skip = ['kpi-books-grid','bookInfoStats','heatmapGrid'].includes(el.id) ||
                 el.classList.contains('kpi-grid-5') ||
                 el.style.gridTemplateColumns.includes('repeat(7') ||
                 el.style.gridTemplateColumns.includes('repeat(5');
    if (!skip) el.setAttribute('data-desktop-grid', '1');
  });
  // Resize charts
  if (window.Chart) {
    Object.values(Chart.instances || {}).forEach(ch => { try { ch.resize(); } catch(e){} });
  }
}
window.applyMobileLayout = applyMobileLayout;
let _mNavActive = 'meta';

// Sections mapped to nav items
const M_SECTIONS = {
  meta:     ['🎯 Meta de Leitura'],
  visao:    ['📊 Visão Geral'],
  graficos: ['📅 Comparativo', '📈 Tendência', '🏅 Rankings'],
  ranking:  ['🏅 Rankings'],
  livro:    ['📖 Progresso'],
  mais:     ['⚡ Sequências', '📆 Calendário', '🔥 Mapa'],
};

function toggleMobileView() {
  _mobileView = !_mobileView;
  const btn = document.getElementById('btn-view-toggle');
  const nav = document.getElementById('mobile-nav');
  if (_mobileView) {
    document.body.classList.add('mobile-view');
    nav.style.display = 'flex';
    btn.textContent = '🖥️';
    btn.title = 'Visão Desktop';
    mNavTo(_mNavActive);
    window.scrollTo(0,0);
  } else {
    document.body.classList.remove('mobile-view');
    nav.style.display = 'none';
    btn.textContent = '📱';
    btn.title = 'Visão Mobile';
    window.scrollTo(0,0);
  }
}
window.toggleMobileView = toggleMobileView;

function mNavTo(section) {
  _mNavActive = section;
  document.querySelectorAll('.m-nav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('mnav-' + section);
  if (activeBtn) activeBtn.classList.add('active');
  if (!_mobileView) return;

  // Simple scroll to section anchor
  const secEl = document.querySelector('[data-msection="' + section + '"]');
  if (secEl) {
    const top = secEl.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  setTimeout(() => {
    if (section === 'graficos') { try{buildWd();}catch(e){} try{buildLivrosMes();}catch(e){} try{buildGeneros();}catch(e){} }
    if (section === 'ranking')  { try{buildRanking();}catch(e){} }
    if (section === 'livro')    { try{buildBookChart();}catch(e){} try{buildBookInfo();}catch(e){} }
  }, 200);
}
window.mNavTo = mNavTo;

// Auto-detect mobile — ativa nav bar via media query, JS só para toggle manual
const _mq = window.matchMedia('(max-width: 600px)');
function _applyMQ(e) {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('btn-view-toggle');
  if (e.matches) {
    if (nav) nav.style.display = 'flex';
    if (btn) { btn.textContent = '🖥️'; btn.title = 'Visão Desktop'; }
    _mobileView = true;
    document.body.classList.add('mobile-view');
    setTimeout(applyMobileLayout, 100);
  } else if (!_mobileView) {
    if (nav) nav.style.display = 'none';
    if (btn) { btn.textContent = '📱'; btn.title = 'Visão Mobile'; }
  }
}
_mq.addEventListener('change', _applyMQ);
window.addEventListener('load', () => { _applyMQ(_mq); if(window.innerWidth < 900) setTimeout(applyMobileLayout, 500); setTimeout(() => { if (typeof ddSetModo === 'function') ddSetModo('mes'); }, 200); });

// ── Changelog ────────────────────────────────────
const CHANGELOG = [
  {
    versao: '2.7', data: '11/06/2026', titulo: 'APIs de Livros, Gerenciar Meta & Ranking Completo',
    itens: [
      'Avaliar Livro: ao selecionar um livro já avaliado, as notas existentes são carregadas e podem ser sobrescritas',
      'Gerenciar Meta (⚙️): selecione em lote quais livros entram na meta de um ano, com busca, filtro por coleção e ordenação',
      'Gerenciar Meta: livros com outra meta ficam ocultos por padrão com toggle para exibi-los (badge 🎯 com o ano)',
      'Ranking Completo: botão para ver 100% dos livros do ranking com os mesmos filtros (modal no desktop)',
      'Conquistas: botão "Ver Todas as Conquistas" com tabela comparativa e títulos exclusivos',
      'Editar Sessão: feedback visual de salvamento e verificação corrigida',
      'Teste API ISBNdb + Open Library: busca por nome/ISBN com capa, autor, páginas, gênero em português e coleção',
    ]
  },
  {
    versao: '2.5', data: '30/05/2026', titulo: 'Mobile, Drill-down & UX',
    itens: [
      'Dashboard Mobile: layout otimizado para celular com scroll infinito (sem abas)',
      'Dashboard Mobile: nav bar inferior com atalhos para cada seção',
      'Gráfico Detalhe de Leitura: barras empilhadas por livro, modo Semana/Mês com navegação ‹ ›',
      'Gráfico Detalhe de Leitura: clique na barra mostra detalhes do dia (livros, páginas, minutos)',
      'Botão + Registrar Sessão nos cards de Lendo e Pausado — abre modal já com livro preenchido',
      'Meta: novo indicador "Págs/dia p/ bater a meta" calculado pelos dias restantes até 31/dez',
      'Gerenciar Sessões: botão ✏️ editar — exclui sessão original e cria nova com dados corrigidos',
      'Campo de data editável no modal de edição de sessão',
    ]
  },
  {
    versao: '2.4', data: '21/05/2026', titulo: 'Perfil de Combate & UX',
    itens: [
      'Perfil de Combate: cálculo correto com tetos fixos por temporada (0-10)',
      'Consistência: calculada por player — dias lidos / período real (1/jan até hoje no ano atual)',
      'Volume/Resistência/Variedade: teto escala pelo número de anos ativos no filtro "Todos"',
      'Radar: pontos coloridos por player, grid mais sutil, tooltip com explicação do cálculo',
      'Grid de scores abaixo do radar mostrando notas individuais',
      'Batalha: card 📆 DIAS LIDOS NO PERÍODO com barra comparativa',
      'Registrar Sessão: scroll roleta para página atual — calcula páginas lidas automaticamente',
      'Gráfico Páginas por Dia: múltiplas sessões no mesmo dia somadas corretamente',
      'Bosses redefinidos para 1000+ páginas',
    ]
  },
  {
    versao: '2.3', data: '18/05/2026', titulo: 'Layout Batalha & Interatividade',
    itens: [
      'Batalha: Competição por Gêneros reformulada — barras divergentes lado a lado igual referência visual',
      'Batalha: Dia Sagrado movido para abaixo de Guerra das Temporadas (layout simétrico)',
      'Batalha: Bosses e Slimes em 2 colunas simétricas',
      'Batalha: Gêneros em linha própria full-width com top 10',
      'Dashboard: clique no gráfico de Gêneros Lidos abre popup com livros do gênero',
      'Dashboard: clique em Coleções Favoritas (gráfico e legenda) abre popup com livros da coleção',
      'Dashboard: clique em Autores Favoritos (gráfico e legenda) abre popup com livros do autor',
      'Capas no popup de gênero agora usam coverUrl diretamente',
      'Fix: batalha voltando ao dashboard não escondia elementos do grid',
      'Bosses redefinidos para 1000+ páginas (era 500+) — mais balanceado com o estilo de leitura',
    ]
  },
  {
    versao: '2.2', data: '18/05/2026', titulo: 'Gêneros, Filtros & Batalha V3',
    itens: [
      'Campo Gênero adicionado em Adicionar/Atualizar Livro (coluna AE)',
      'Gráfico 🌎 Gêneros Lidos no dashboard com barras horizontais e %',
      'Filtro de ano na Visão Geral agora filtra maior/menor livro, melhor/pior avaliado e listas por status',
      'Filtro usa data de conclusão (coluna Q) como referência principal',
      'Batalha V3: visual dark RPG completo com conquistas por tier, títulos exclusivos e competição por gêneros',
      'Sistema de conquistas com 6 tiers: Bronze → Prata → Ouro → Platina → Diamante → Mestre',
      'Ranking por Notas: filtro por coleção adicionado',
      'Backup automático da planilha no Google Drive (função fazerBackupDrive)',
      'Nota média visível em Detalhes do Livro com relatório por critério clicável',
      'Registrar Sessão: grava data de conclusão (col Q) e início (col AC) automaticamente',
    ]
  },
  {
    versao: '2.1', data: '15/05/2026', titulo: 'Correções & Polimento',
    itens: [
      'Sistema multi-usuário totalmente funcional — Milton e Daniel com dados 100% separados',
      'Registrar Sessão: data gravada corretamente sem conversão de fuso horário',
      'Excluir Sessão: novo botão no FAB com lista filtrável e remoção imediata da UI',
      'Atualizar Livro: campo de página atual removido, seletor de status adicionado',
      'Dica de Leitura: respeita dependências do usuário ativo',
      'Recarregamento inteligente: tenta até 8x a cada 2s até detectar mudança no JSON',
      'Meta de Leitura: cálculo de páginas lidas corrigido',
    ]
  },
  {
    versao: '2.0', data: '15/05/2026', titulo: 'Multi-usuário & Batalha',
    itens: [
      'Sistema de múltiplos usuários — Milton e Daniel com dados 100% separados',
      'Seletor de usuário no header — troca filtra todos os dados em tempo real',
      'Página ⚔️ Batalha com 8 duelos gamificados',
      'Colunas de usuário: Alimentação Q, Geral AB, Notas P',
      'Todos os botões PWA cientes do usuário ativo',
      'Botão 📚 Todos na Visão Geral',
      'Planilha Geral expandida para 1000 linhas iniciando na linha 5',
    ]
  },
  {
    versao: '1.0', data: '14/05/2026', titulo: 'Lançamento — Projeto Final V1',
    itens: [
      'Dashboard completo com Meta de Leitura, Visão Geral, Rankings e Gráficos',
      'Calendário de Leitura e Mapa de Calor Anual',
      'Sequências de Leitura com streak atual e recorde',
      'Coleções Favoritas e Autores Favoritos com 4 modos de visualização',
      'Ranking por Notas com 10 critérios de avaliação',
      'Lista de livros por status com filtros e ordem da coleção',
      'Botões PWA: Adicionar, Registrar Sessão, Avaliar, Atualizar, Roleta, Excluir',
      'Capas com zoom via hover e cascata Amazon → Open Library',
      'Suporte mobile com layout responsivo',
    ]
  }
];

function toggleChangelog() {
  const overlay = document.getElementById('changelogOverlay');
  const isOpen = overlay.style.display === 'flex';
  if (isOpen) { overlay.style.display = 'none'; return; }

  // Renderiza changelog
  const lista = document.getElementById('changelogList');
  lista.innerHTML = CHANGELOG.map(c => `
    <div style="margin-bottom:24px;border-left:3px solid var(--purple);padding-left:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="background:var(--purple);color:white;padding:3px 10px;border-radius:6px;font-size:13px;font-weight:700;">v${c.versao}</span>
        <span style="font-size:13px;color:var(--muted);">${c.data}</span>
        <span style="font-size:15px;font-weight:700;color:var(--text);">${c.titulo}</span>
      </div>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;">
        ${c.itens.map(i => `<li style="font-size:14px;color:var(--muted);">${i}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  overlay.style.display = 'flex';
}

// Fecha ao clicar no overlay
document.getElementById('changelogOverlay').addEventListener('click', e => {
  if (e.target.id === 'changelogOverlay') toggleChangelog();
});
let statusAtual = null;
let livrosStatusAtual = [];
window._anoVG = 'total'; // ano selecionado na Visão Geral

function toggleListaStatus(status) {
  const painel = document.getElementById('painelStatus');
  if (statusAtual === status || !status) {
    painel.style.display = 'none'; statusAtual = null; return;
  }
  statusAtual = status;
  const titulos = { Completo:'✅ Concluídos', Lendo:'📖 Lendo', Pausado:'⏸️ Pausados', Aguardando:'📋 Aguardando', Todos:'📚 Todos os Livros' };
  document.getElementById('painelStatusTitulo').textContent = titulos[status];

  const _anoBtn = document.getElementById('selVGAno')?.value || 'total';
  const _sessAll = window._sessoes || [];

  // Mapa: livro -> ano da última sessão (ano de conclusão real)
  const _ultimaAnoLivro = {};
  _sessAll.forEach(s => {
    const a = s.data?.slice(0,4) || '';
    if (a && (!_ultimaAnoLivro[s.livro] || a > _ultimaAnoLivro[s.livro]))
      _ultimaAnoLivro[s.livro] = a;
  });

  livrosStatusAtual = (status === 'Todos' ? (window._livros||[]) : (window._livros||[]).filter(l=>l.status===status))
    .filter(l => {
      if (_anoBtn === 'total') return true;
      // Prioridade: data de conclusão (col Q) > metaAno (col P) > última sessão
      const anoRef = (l.anoConclusao && l.anoConclusao.length === 4)
        ? l.anoConclusao
        : (l.metaAno && String(l.metaAno).length === 4)
          ? String(l.metaAno)
          : (_ultimaAnoLivro[l.livro] || '');
      return anoRef === _anoBtn;
    });

  // Coleção: usa campo do livro, ou busca nas sessões, ou usa colecao do livro do JSON global
  const getColecao = (l) => {
    if (l.colecao) return l.colecao;
    const s = (window._sessoes||[]).find(x => x.livro === l.livro);
    return s?.colecao || '';
  };

  // Popular seletor de coleções
  const colecoes = [...new Set(livrosStatusAtual.map(getColecao).filter(Boolean))].sort();
  const selCol = document.getElementById('ps-colecao');
  selCol.innerHTML = '<option value="">Todas as coleções</option>';
  colecoes.forEach(c => selCol.innerHTML += `<option value="${c}">${c}</option>`);

  painel.style.display = 'block';
  renderListaStatus();
  painel.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function renderListaStatus() {
  const ordem  = document.getElementById('ps-ordem').value;
  const colFil = document.getElementById('ps-colecao').value;
  const sess   = window._sessoes || [];

  // Enriquece com coleção e ordemColecao — vem do JSON via window._livros
  const livrosMap = new Map((window._livros||[]).map(l => [l.livro, l]));
  const getCol = (l) => l.colecao || livrosMap.get(l.livro)?.colecao || (window._sessoes||[]).find(s=>s.livro===l.livro)?.colecao || '';
  const getOrdem = (l) => {
    const o = l.ordemColecao || livrosMap.get(l.livro)?.ordemColecao || 0;
    return o > 0 ? o : 9999;
  };
  let livros = livrosStatusAtual.map(l => ({ ...l, colecaoReal: getCol(l), ordemReal: getOrdem(l) }));

  // Filtro coleção
  if (colFil) livros = livros.filter(l => l.colecaoReal === colFil);

  // Ordenação
  livros = [...livros].sort((a,b) => {
    if (ordem === 'az')      return a.livro.localeCompare(b.livro, 'pt-BR');
    if (ordem === 'za')      return b.livro.localeCompare(a.livro, 'pt-BR');
    if (ordem === 'mais')    return (b.totalPag||0) - (a.totalPag||0);
    if (ordem === 'menos')   return (a.totalPag||0) - (b.totalPag||0);
    if (ordem === 'colecao') {
      const cA = a.colecaoReal || '';
      const cB = b.colecaoReal || '';
      if (!cA && cB) return 1;
      if (cA && !cB) return -1;
      if (cA !== cB) return cA.localeCompare(cB, 'pt-BR');
      const oA = a.ordemReal > 0 ? a.ordemReal : 9999;
      const oB = b.ordemReal > 0 ? b.ordemReal : 9999;
      return oA - oB;
    }
    return 0;
  });

  document.getElementById('ps-count').textContent = `${livros.length} livro${livros.length!==1?'s':''}`;

  const lista = document.getElementById('painelStatusLista');

  if (!livros.length) {
    lista.innerHTML = '<div style="color:var(--muted);text-align:center;padding:16px;">Nenhum livro</div>';
    return;
  }

  // Constrói todo HTML de uma vez para não travar com listas grandes
  const html = livros.map(l => {
    const capa = coverThumb(l.isbn, l.coverUrl||'') ||
      `<div style="width:36px;height:50px;background:var(--bg3);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">📖</div>`;
    let extra = '';
    if (statusAtual === 'Completo') {
      const diasLidos = new Set(sess.filter(s=>s.livro===l.livro).map(s=>s.data)).size;
      const pagTot = sess.filter(s=>s.livro===l.livro).reduce((a,s)=>a+s.paginas,0);
      const media = diasLidos > 0 ? Math.round(pagTot/diasLidos) : 0;
      extra = `<div style="font-size:11px;color:var(--muted);margin-top:2px;">📅 ${diasLidos} dias · ⚡ ${media} págs/dia</div>`;
    }
    const statusIcon = statusAtual === 'Todos'
      ? `<span style="font-size:10px;color:var(--muted);">${l.status==='Completo'?'✅':l.status==='Lendo'?'📖':l.status==='Pausado'?'⏸️':'📋'} ${l.status}</span>`
      : '';
    const colTag = l.colecaoReal ? `<span style="font-size:10px;color:var(--purple);background:rgba(139,124,248,0.12);padding:1px 6px;border-radius:4px;">${l.colecaoReal}</span>` : '';
    return `<div style="display:flex;gap:10px;align-items:center;padding:8px;background:var(--bg3);border-radius:10px;overflow:visible;position:relative;cursor:pointer;" onclick="fecharPainel();abrirLivroDetalhes('${l.livro.replace(/'/g,"\\'")}')">
      <div style="flex-shrink:0;">${capa}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.livro}</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:2px;">${l.autor||''} ${colTag} ${statusIcon}</div>
        ${extra}
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:14px;font-weight:700;color:var(--teal);">${(l.totalPag||0).toLocaleString('pt-BR')}</div>
        <div style="font-size:10px;color:var(--muted);">págs</div>
      </div>
    </div>`;
  }).join('');

  lista.innerHTML = html;
}
window.toggleListaStatus = toggleListaStatus;
window.renderListaStatus = renderListaStatus;

// ── Roleta de Leitura ───────────────────────────
let modoRoleta = 'meta';
function setModoRoleta(modo) {
  modoRoleta = modo;
  const btnMeta  = document.getElementById('roleta-btn-meta');
  const btnTodos = document.getElementById('roleta-btn-todos');
  btnMeta.style.background  = modo==='meta'  ? '#e56cff' : 'var(--bg3)';
  btnMeta.style.color       = modo==='meta'  ? 'white'   : 'var(--muted)';
  btnTodos.style.background = modo==='todos' ? '#e56cff' : 'var(--bg3)';
  btnTodos.style.color      = modo==='todos' ? 'white'   : 'var(--muted)';
}
window.setModoRoleta = setModoRoleta;

function girarRoleta() {
  const anoAtual = new Date().getFullYear().toString();
  const livrosLidos = new Set((window._livros||[]).filter(l=>l.status==='Completo').map(l=>l.livro));
  let pool = (window._livros||[]).filter(l => {
    if (l.status !== 'Aguardando') return false;
    if (l.depende && !livrosLidos.has(l.depende.trim())) return false;
    if (modoRoleta === 'meta' && l.metaAno && l.metaAno !== anoAtual) return false;
    return true;
  });
  if (!pool.length) { alert('Nenhum livro disponível!'); return; }

  document.getElementById('roleta-resultado').style.display = 'none';
  document.getElementById('roleta-girando').style.display   = 'block';
  document.getElementById('roleta-novamente').style.display = 'none';

  setTimeout(() => {
    const s = pool[Math.floor(Math.random()*pool.length)];
    const sessAll = window._sessoes || [];
    const diasSet = new Set(sessAll.map(x=>x.data).filter(Boolean));
    const pagTot  = sessAll.reduce((a,x)=>a+x.paginas, 0);
    const media   = diasSet.size > 0 ? pagTot/diasSet.size : 50;
    const dias    = Math.ceil((s.totalPag||200)/media);

    document.getElementById('roleta-girando').style.display   = 'none';
    document.getElementById('roleta-resultado').style.display = 'block';
    document.getElementById('roleta-nome').textContent  = s.livro;
    document.getElementById('roleta-autor').textContent = s.autor || '';
    document.getElementById('roleta-pag').textContent   = (s.totalPag||0).toLocaleString('pt-BR');
    document.getElementById('roleta-dias').textContent  = '~' + dias;
    document.getElementById('roleta-novamente').style.display = 'block';
    document.getElementById('roleta-capa').innerHTML =
      coverImg(s.isbn,'📖','',s.coverUrl||'').replace('width:60px;height:84px','width:100px;height:140px');
  }, 1200);
}
window.girarRoleta = girarRoleta;

// ── Excluir Livro ────────────────────────────────
async function confirmarExcluir() {
  const livro = document.getElementById('ex-livro').value;
  if (!livro) { mostrarMsg('ex-msg','Selecione o livro!','err'); return; }
  const btn = document.getElementById('ex-btn');
  btn.disabled = true; btn.textContent = 'Excluindo...';
  try {
    const r = await fetch(API_URL, { method:'POST', body: JSON.stringify({ acao:'excluirLivro', livro }) });
    const d = await r.json();
    if (d.ok) {
      mostrarMsg('ex-msg','✅ '+d.msg,'ok');
      livrosCache = [];
      setTimeout(() => fecharModal('excluir'), 2000);
      recarregarAteAtualizar((window._dadosD?.sessoes||[]).length);
    } else { mostrarMsg('ex-msg','❌ '+(d.erro||'Erro'),'err'); }
  } catch(e) { mostrarMsg('ex-msg','❌ Erro de conexão','err'); }
  btn.disabled = false; btn.textContent = '🗑️ Confirmar Exclusão';
}

const API_URL = 'https://script.google.com/macros/s/AKfycbzuNZzuy8fzaql5xpecEG6yG2aXMdkkeDpPbkaTV_ro6f1TkixI37s8aJxO0lPqIYOM/exec';
let fabOpen = false;
let livrosCache = [];
let colecoesCache = [];

function toggleFabMenu() {
  fabOpen = !fabOpen;
  document.getElementById('fabMenu').style.display = fabOpen ? 'flex' : 'none';
  document.getElementById('fabBtn').textContent = fabOpen ? '✕' : '＋';
}

function abrirModal(tipo) {
  toggleFabMenu();
  const id = 'modal' + tipo.charAt(0).toUpperCase() + tipo.slice(1);
  document.getElementById(id).classList.add('open');
  if (tipo === 'sessao') {
    document.getElementById('s-data').value = new Date().toISOString().slice(0,10);
    carregarLivros();
  }
  if (tipo === 'nota' || tipo === 'livro' || tipo === 'excluir') carregarLivros();
  if (tipo === 'roleta') setModoRoleta('meta');
  if (tipo === 'excluirSessao') {
    document.getElementById('es-filtro').value = '';
    renderSessoesExcluir();
  }
}

function fecharModal(tipo) {
  const id = 'modal' + tipo.charAt(0).toUpperCase() + tipo.slice(1);
  document.getElementById(id).classList.remove('open');
  ['s-msg','n-msg','l-msg','nl-msg','ex-msg','es-msg','isbndb-msg','ol-msg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'pwa-msg'; el.textContent = ''; }
  });
  if (tipo === 'nota') {
    limparBuscaSelect('n');
  }
  if (tipo === 'testeIsbndb') {
    document.getElementById('isbndb-busca').value = '';
    document.getElementById('isbndb-resultado').style.display = 'none';
  }
  if (tipo === 'testeOpenLibrary') {
    document.getElementById('ol-busca').value = '';
    document.getElementById('ol-resultado').style.display = 'none';
  }
}

function renderSessoesExcluir() {
  const filtro = (document.getElementById('es-filtro')?.value || '').toLowerCase();
  const u = usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual;
  const sessoes = [...(window._sessoes || [])]
    .filter(s => !filtro || s.livro.toLowerCase().includes(filtro))
    .sort((a,b) => b.data.localeCompare(a.data))
    .slice(0, 50); // máx 50

  const lista = document.getElementById('es-lista');
  lista.innerHTML = '';
  if (!sessoes.length) {
    lista.innerHTML = '<div style="color:var(--muted);text-align:center;padding:16px;">Nenhuma sessão encontrada</div>';
    return;
  }
  sessoes.forEach(s => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;';
    div.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.livro}</div>
        <div style="font-size:12px;color:var(--muted);">${s.data} · ${s.paginas} págs${s.minutos ? ' · '+Math.round(s.minutos)+'min' : ''}</div>
      </div>
      <button class="es-edit-btn"
        style="background:var(--purple);border:none;color:white;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;">✏️</button>
      <button data-livro="${s.livro.replace(/"/g,'&quot;')}" data-data="${s.data}" data-paginas="${s.paginas}"
        class="es-del-btn"
        style="background:#e53935;border:none;color:white;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;">🗑️</button>`;
    div.querySelector('.es-del-btn').addEventListener('click', () => {
      excluirSessao(s.livro, s.data, s.paginas);
    });
    div.querySelector('.es-edit-btn').addEventListener('click', () => {
      editarSessaoDesktop(s);
    });
    lista.appendChild(div);
  });
}
window.renderSessoesExcluir = renderSessoesExcluir;

function editarSessaoDesktop(s) {
  fecharModal('excluirSessao');
  // Preenche o modal de edição
  document.getElementById('ee-livro-original').value = s.livro;
  document.getElementById('ee-data-original').value = s.data;
  document.getElementById('ee-paginas-original').value = s.paginas;
  document.getElementById('ee-livro-nome').textContent = s.livro;
  document.getElementById('ee-data').value = s.data;
  document.getElementById('ee-paginas').value = s.paginas;
  const h = s.minutos ? Math.floor(s.minutos/60) : 0;
  const m = s.minutos ? Math.round(s.minutos%60) : 0;
  document.getElementById('ee-horas').value = h || '';
  document.getElementById('ee-minutos').value = m || '';
  document.getElementById('ee-msg').className = 'pwa-msg';
  document.getElementById('ee-msg').textContent = '';
  abrirModal('editarSessao');
}
window.editarSessaoDesktop = editarSessaoDesktop;

async function salvarEdicaoSessao() {
  const btn           = document.getElementById('ee-btn');
  const livro         = document.getElementById('ee-livro-original').value;
  const dataOriginal  = document.getElementById('ee-data-original').value;
  const paginasOrig   = Number(document.getElementById('ee-paginas-original').value);
  const novaData      = document.getElementById('ee-data').value;
  const novasPaginas  = Number(document.getElementById('ee-paginas').value);
  const horas         = Number(document.getElementById('ee-horas').value) || 0;
  const minutos       = Number(document.getElementById('ee-minutos').value) || 0;
  const totalMinutos  = horas * 60 + minutos;
  const usuario       = usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual;

  if (!novaData || !novasPaginas) {
    mostrarMsg('ee-msg', '⚠️ Preencha data e páginas', 'err'); return;
  }
  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Salvando...';
  mostrarMsg('ee-msg', 'Salvando...', '');
  try {
    // 1. Excluir sessão original
    const r1 = await fetch(API_URL, { method:'POST',
      body: JSON.stringify({ acao:'excluirSessao', livro, data:dataOriginal, paginas:paginasOrig, usuario })
    });
    const d1 = await r1.json();
    if (!d1.ok) {
      mostrarMsg('ee-msg', '❌ Erro ao excluir original: '+(d1.erro||''), 'err');
      btn.disabled = false; btn.textContent = textoOriginal;
      return;
    }

    // 2. Criar nova sessão com dados editados
    const r2 = await fetch(API_URL, { method:'POST',
      body: JSON.stringify({ acao:'registrarSessao', livro, paginas:novasPaginas, minutos:totalMinutos, data:novaData, usuario })
    });
    const d2 = await r2.json();
    if (d2.ok) {
      mostrarMsg('ee-msg', '✅ Sessão editada!', 'ok');
      btn.textContent = '✅ Salvo!';
      setTimeout(() => {
        fecharModal('editarSessao');
        recarregarAteAtualizar(0, (d) => {
          const sessoes = d.sessoes || [];
          const aindaTemAntiga = sessoes.some(s => s.livro === livro && s.data === dataOriginal && Number(s.paginas) === paginasOrig);
          const temNova = sessoes.some(s => s.livro === livro && s.data === novaData && Number(s.paginas) === novasPaginas);
          return temNova && !aindaTemAntiga;
        });
        btn.disabled=false; btn.textContent=textoOriginal;
      }, 1200);
    } else {
      mostrarMsg('ee-msg', '❌ Erro ao criar nova: '+(d2.erro||''), 'err');
      btn.disabled = false; btn.textContent = textoOriginal;
    }
  } catch(e) {
    mostrarMsg('ee-msg', '❌ Erro de conexão', 'err');
    btn.disabled = false; btn.textContent = textoOriginal;
  }
}
window.salvarEdicaoSessao = salvarEdicaoSessao;

async function excluirSessao(livro, data, paginas) {
  if (!confirm(`Excluir sessão de "${livro}" em ${data}?`)) return;
  const msg = document.getElementById('es-msg');
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ acao: 'excluirSessao', livro, data, paginas: Number(paginas), usuario: usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual })
    });
    const d = await r.json();
    if (d.ok) {
      mostrarMsg('es-msg', '✅ Sessão excluída!', 'ok');
      // Remove da lista local imediatamente
      const antes = (window._sessoes||[]).length;
      window._sessoes = (window._sessoes||[]).filter(s =>
        !(s.livro === livro && String(s.paginas) === String(paginas) && s.data === data)
      );
      renderSessoesExcluir();
      recarregarAteAtualizar();
    } else { mostrarMsg('es-msg', '❌ ' + (d.erro||'Erro'), 'err'); }
  } catch(e) { mostrarMsg('es-msg', '❌ Erro de conexão', 'err'); }
}
window.excluirSessao = excluirSessao;

// Fecha modal ao clicar no overlay
document.addEventListener('click', e => {
  if (e.target.classList.contains('pwa-overlay')) e.target.classList.remove('open');
});

async function carregarLivros() {
  // Se livrosCache já foi populado pelo setUsuario, usa direto
  if (livrosCache.length > 0) { popularSelects(); return; }
  // Caso contrário, usa window._livros que já está filtrado
  if (window._livros && window._livros.length > 0) {
    livrosCache = window._livros;
    popularSelects();
    return;
  }
  try {
    const r = await fetch('/data.json');
    const d = await r.json();
    const u = (typeof usuarioAtual !== 'undefined' ? usuarioAtual : 'Milton');
    const todos = [...(d.livros||[]), ...(d.lendo||[]), ...(d.pausados||[]), ...(d.aguardando||[])];
    livrosCache = todos
      .filter(l => l.livro && l.livro.length > 1)
      .filter(l => u === 'Milton'
        ? (!l.usuario || l.usuario === '' || l.usuario.toUpperCase() === 'MILTON')
        : l.usuario?.toUpperCase() === u.toUpperCase())
      .filter((l,i,arr) => arr.findIndex(x=>x.livro===l.livro)===i);
    const cols = new Set(livrosCache.map(l=>l.colecao).filter(Boolean));
    colecoesCache = [...cols].sort();
    popularSelects();
  } catch(e) { console.error('Erro ao carregar livros:', e); }
}

function popularSelects() {
  // Sessão — lista populada dinamicamente via filtrarLivrosSessao quando usuário digita
  // n-livro, l-livro e ex-livro são hidden inputs com busca por texto
  const dl = document.getElementById('colecoes-datalist');
  if (dl) {
    dl.innerHTML = '';
    colecoesCache.forEach(c => { dl.innerHTML += `<option value="${c}">`; });
  }
}

function filtrarLivrosSessao(termo) {
  const lista = document.getElementById('s-livro-lista');
  // Usa window._livros (já filtrado por usuário) como fonte principal
  const pool = (window._livros && window._livros.length > 0 ? window._livros : livrosCache)
    .filter(l => l.status !== 'Completo'); // sessão só para livros não concluídos
  const filtrados = pool.filter(l => !termo || l.livro.toLowerCase().includes(termo.toLowerCase())).slice(0, 15);

  if (!termo || !filtrados.length) { lista.style.display = 'none'; return; }
  lista.style.display = 'block';
  lista.innerHTML = '';
  filtrados.forEach(l => {
    const icon = l.status==='Lendo'?'📖':l.status==='Pausado'?'⏸️':'📋';
    const item = document.createElement('div');
    item.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid var(--border);';
    item.textContent = icon + ' ' + l.livro;
    item.onmouseenter = () => item.style.background = 'var(--bg4)';
    item.onmouseleave = () => item.style.background = '';
    item.addEventListener('mousedown', e => { e.preventDefault(); selecionarLivroSessao(l); });
    item.addEventListener('touchstart', e => { e.preventDefault(); selecionarLivroSessao(l); }, {passive:false});
    lista.appendChild(item);
  });
}
window.filtrarLivrosSessao = filtrarLivrosSessao;

function filtrarSelect(buscaId, hiddenId, filtro) {
  const termo = document.getElementById(buscaId).value.toLowerCase();
  const listaId = buscaId.replace('-busca', '-lista');
  const lista = document.getElementById(listaId);

  // Usa window._livros como fonte principal (já filtrado por usuário)
  const base = (window._livros && window._livros.length > 0 ? window._livros : livrosCache);
  let pool = base;
  if (filtro === 'completo') pool = base.filter(l => l.status === 'Completo');

  const filtrados = pool.filter(l => !termo || l.livro.toLowerCase().includes(termo)).slice(0, 15);

  if (!termo || !filtrados.length) { lista.style.display = 'none'; return; }

  lista.innerHTML = '';
  filtrados.forEach(l => {
    const icon = l.status==='Completo'?'✅':l.status==='Lendo'?'📖':l.status==='Pausado'?'⏸️':'📋';
    const item = document.createElement('div');
    item.style.cssText = 'padding:9px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid var(--border);';
    item.textContent = `${icon} ${l.livro}`;
    item.onmouseenter = () => item.style.background = 'var(--bg4)';
    item.onmouseleave = () => item.style.background = '';
    item.addEventListener('mousedown', e => { e.preventDefault(); selecionarBuscaSelect(buscaId, hiddenId, l); });
    item.addEventListener('touchstart', e => { e.preventDefault(); selecionarBuscaSelect(buscaId, hiddenId, l); }, {passive:false});
    lista.appendChild(item);
  });
  lista.style.display = 'block';
}

function selecionarBuscaSelect(buscaId, hiddenId, l) {
  const prefix = hiddenId.split('-')[0]; // 'n' or 'l'
  document.getElementById(hiddenId).value = l.livro;
  document.getElementById(buscaId).value = '';
  document.getElementById(buscaId).placeholder = l.livro;
  document.getElementById(buscaId.replace('-busca','-lista')).style.display = 'none';
  const sel = document.getElementById(prefix + '-livro-sel');
  sel.textContent = `✅ ${l.livro} — toque para limpar`;
  sel.style.display = 'block';
  if (prefix === 'l') preencherDadosLivro(l.livro);
  if (prefix === 'n') preencherNotaExistente(l.livro);
}

const CRITERIOS_NOTA = ['Diálogos','Enredo','Estilo Visual','Finalização','Imersão',
                   'Impacto Emocional','Originalidade','Personagens','Ritmo','Temas'];

function preencherNotaExistente(livro) {
  const notaExistente = (window.NOTES || []).find(n => n.livro === livro);
  CRITERIOS_NOTA.forEach((c, i) => {
    const el = document.getElementById('n-'+i);
    if (!el) return;
    const v = notaExistente?.criterios?.[c];
    el.value = (v !== undefined && v > 0) ? v : '';
  });
  if (notaExistente?.ano > 2000) {
    document.getElementById('n-ano').value = notaExistente.ano;
  }
  // Atualiza média exibida
  const vals = CRITERIOS_NOTA.map((c,i) => parseFloat(document.getElementById('n-'+i)?.value) || 0).filter(v => v > 0);
  const media = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : '—';
  document.getElementById('n-media').textContent = media;
  // Aviso visual de edição
  const msgEl = document.getElementById('n-msg');
  if (msgEl) {
    if (notaExistente) {
      msgEl.className = 'pwa-msg ok';
      msgEl.textContent = 'ℹ️ Avaliação existente carregada — salvar irá sobrescrevê-la.';
    } else {
      msgEl.className = 'pwa-msg';
      msgEl.textContent = '';
    }
  }
}

function limparBuscaSelect(prefix) {
  document.getElementById(prefix + '-livro').value = '';
  document.getElementById(prefix + '-livro-busca').placeholder = 'Digite para buscar...';
  document.getElementById(prefix + '-livro-sel').style.display = 'none';
  if (prefix === 'n') limparCamposNota();
}

function limparCamposNota() {
  CRITERIOS_NOTA.forEach((c, i) => {
    const el = document.getElementById('n-'+i);
    if (el) el.value = '';
  });
  document.getElementById('n-ano').value = new Date().getFullYear();
  document.getElementById('n-media').textContent = '—';
  const msgEl = document.getElementById('n-msg');
  if (msgEl) { msgEl.className = 'pwa-msg'; msgEl.textContent = ''; }
}

function selecionarLivroSessao(l) {
  document.getElementById('s-livro').value = l.livro;
  document.getElementById('s-livro-busca').value = '';
  document.getElementById('s-livro-busca').placeholder = l.livro;
  document.getElementById('s-livro-lista').style.display = 'none';
  const sel = document.getElementById('s-livro-selecionado');
  const icon = l.status==='Lendo'?'📖':l.status==='Pausado'?'⏸️':'📋';
  sel.textContent = icon + ' ' + l.livro + ' ✕';
  sel.style.display = 'block';
  // Inicializa scroll de página com pagAtual do livro
  iniciarScrollPagina(l.pagAtual||0, l.totalPag||0);
  // Verifica dependência
  if (l.depende) {
    const dep = livrosCache.find(x => x.livro === l.depende);
    if (dep && dep.status !== 'Completo') {
      mostrarMsg('s-msg', `⚠️ Este livro depende de "${l.depende}" que ainda não foi concluído.`, 'err');
    }
  }
}

// ── Scroll de página ──────────────────────────────────────────────
let _paginaAtual = 0, _totalPag = 0, _startY = null, _startPag = null;

function iniciarScrollPagina(pagAtual, totalPag) {
  _paginaAtual = pagAtual;
  _totalPag = totalPag;
  // Seta a página anterior (onde parou) no campo hidden
  const campoAnterior = document.getElementById('s-pagina-atual');
  if (campoAnterior) campoAnterior.value = pagAtual;
  atualizarDisplayPagina();
  const el = document.getElementById('s-pagina-scroll');
  if (!el) return;
  el.addEventListener('wheel', e => { e.preventDefault(); stepPagina(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  el.addEventListener('touchstart', e => { _startY = e.touches[0].clientY; _startPag = _paginaAtual; }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (_startY === null) return;
    const dy = _startY - e.touches[0].clientY;
    const delta = Math.round(dy / 4);
    _paginaAtual = Math.max(_startPag||0, Math.min(_totalPag, (_startPag||0) + delta));
    atualizarDisplayPagina();
  }, { passive: true });
  el.addEventListener('mousedown', e => { _startY = e.clientY; _startPag = _paginaAtual; });
  el.addEventListener('mousemove', e => {
    if (_startY === null) return;
    const dy = _startY - e.clientY;
    const delta = Math.round(dy / 4);
    _paginaAtual = Math.max(_startPag||0, Math.min(_totalPag, (_startPag||0) + delta));
    atualizarDisplayPagina();
  });
  el.addEventListener('mouseup', () => { _startY = null; _startPag = null; });
  el.addEventListener('mouseleave', () => { _startY = null; _startPag = null; });
}
window.iniciarScrollPagina = iniciarScrollPagina;

function stepPagina(delta) {
  _paginaAtual = Math.max(0, Math.min(_totalPag, _paginaAtual + delta));
  atualizarDisplayPagina();
}
window.stepPagina = stepPagina;

function atualizarDisplayPagina() {
  const pagAnterior = parseInt(document.getElementById('s-pagina-atual')?.value) || 0;
  const paginasLidas = Math.max(0, _paginaAtual - pagAnterior);
  const pct = _totalPag > 0 ? Math.round(_paginaAtual / _totalPag * 100) : 0;
  const el = (id) => document.getElementById(id);
  if (el('s-pagina-prev')) el('s-pagina-prev').textContent = pagAnterior > 0 ? `anterior: ${pagAnterior}` : '—';
  if (el('s-pagina-cur')) el('s-pagina-cur').textContent = _paginaAtual || '—';
  if (el('s-pagina-pct')) el('s-pagina-pct').textContent = `${pct}% do livro`;
  if (el('s-pagina-lidas-label')) el('s-pagina-lidas-label').textContent = paginasLidas > 0 ? `+${paginasLidas} págs lidas` : '';
  if (el('s-paginas')) el('s-paginas').value = paginasLidas;
  // NÃO sobrescreve s-pagina-atual aqui
}
window.atualizarDisplayPagina = atualizarDisplayPagina;

function limparLivroSessao() {
  document.getElementById('s-livro').value = '';
  document.getElementById('s-livro-busca').placeholder = 'Digite para buscar...';
  document.getElementById('s-livro-selecionado').style.display = 'none';
  _paginaAtual = 0; _totalPag = 0; _startY = null; _startPag = null;
  atualizarDisplayPagina();
  const msg = document.getElementById('s-msg');
  if (msg?.textContent.includes('depende')) { msg.className='pwa-msg'; msg.textContent=''; }
}
document.addEventListener('change', e => {
  if (e.target.id !== 's-livro') return;
  const livro = e.target.value;
  if (!livro) return;
  const livroData = livrosCache.find(l => l.livro === livro);
  const depende = livroData?.depende;
  if (!depende) return;
  const dependeData = livrosCache.find(l => l.livro === depende);
  if (dependeData && dependeData.status !== 'Completo') {
    mostrarMsg('s-msg', `⚠️ Atenção: este livro depende de "${depende}" que ainda não foi concluído.`, 'err');
  } else {
    const el = document.getElementById('s-msg');
    if (el && el.textContent.includes('depende')) {
      el.className = 'pwa-msg'; el.textContent = '';
    }
  }
});

// Calcula média ao digitar notas
document.addEventListener('input', e => {
  if (!e.target.id?.startsWith('n-')) return;
  const vals = [0,1,2,3,4,5,6,7,8,9]
    .map(i => parseFloat(document.getElementById('n-'+i)?.value) || 0)
    .filter(v => v > 0);
  const media = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : '—';
  document.getElementById('n-media').textContent = media;
});

async function enviarSessao() {
  const btn = document.getElementById('s-btn');
  const msg = document.getElementById('s-msg');
  const livro = document.getElementById('s-livro').value;
  const paginas = document.getElementById('s-paginas').value;
  const dataRaw = document.getElementById('s-data').value; // yyyy-MM-dd
  const partes = dataRaw.split('-');
  const dataTexto = partes[2] + '/' + partes[1] + '/' + partes[0]; // 14/05/2026
  if (!livro || !paginas) { mostrarMsg('s-msg', 'Preencha o livro e as páginas!', 'err'); return; }

  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        acao: 'registrarSessao',
        livro,
        data:     dataTexto,
        paginas:  Number(paginas),
        horas:    Number(document.getElementById('s-horas').value) || 0,
        minutos:  Number(document.getElementById('s-minutos').value) || 0,
        segundos: Number(document.getElementById('s-segundos').value) || 0,
        usuario:  usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual,
      })
    });
    const d = await r.json();
    if (d.ok) {
      mostrarMsg('s-msg', '✅ ' + d.msg, 'ok');
      setTimeout(() => fecharModal('sessao'), 2000);
      recarregarAteAtualizar((window._dadosD?.sessoes||[]).length);
    } else {
      mostrarMsg('s-msg', '❌ ' + d.erro, 'err');
    }
  } catch(e) {
    mostrarMsg('s-msg', '❌ Erro de conexão', 'err');
  }
  btn.disabled = false;
  btn.textContent = '✅ Salvar Sessão';
}

async function enviarNota() {
  const btn = document.getElementById('n-btn');
  const livro = document.getElementById('n-livro').value;
  if (!livro) { mostrarMsg('n-msg', 'Selecione o livro!', 'err'); return; }

  const CRITERIOS = ['Diálogos','Enredo','Estilo Visual','Finalização','Imersão',
                     'Impacto Emocional','Originalidade','Personagens','Ritmo','Temas'];
  const criterios = {};
  CRITERIOS.forEach((c, i) => {
    const v = parseFloat(document.getElementById('n-'+i)?.value);
    if (!isNaN(v) && v > 0) criterios[c] = v;
  });

  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        acao: 'registrarNota',
        livro,
        ano: Number(document.getElementById('n-ano').value) || new Date().getFullYear(),
        criterios,
        usuario: usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual,
      })
    });
    const d = await r.json();
    if (d.ok) {
      mostrarMsg('n-msg', '✅ ' + d.msg, 'ok');
      recarregarAteAtualizar((window._dadosD?.sessoes||[]).length);
      setTimeout(() => fecharModal('nota'), 2000);
    } else {
      mostrarMsg('n-msg', '❌ ' + d.erro, 'err');
    }
  } catch(e) {
    mostrarMsg('n-msg', '❌ Erro de conexão', 'err');
  }
  btn.disabled = false;
  btn.textContent = '✅ Salvar Avaliação';
}

function preencherDadosLivro(nome) {
  if (!nome) return;
  const pool = (livrosCache.length > 0 ? livrosCache : window._livros) || [];
  const l = pool.find(x => x.livro === nome);
  if (!l) return;
  const statusEl = document.getElementById('l-status');
  if (statusEl) {
    statusEl.value = '';
    for (let i = 0; i < statusEl.options.length; i++) {
      if (statusEl.options[i].value === l.status) { statusEl.selectedIndex = i; break; }
    }
  }
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
  set('l-autor',   l.autor);
  set('l-paginas', l.totalPag);
  set('l-metaano', l.metaAno);
  set('l-ordem',   l.ordemColecao || l.ordem);
  set('l-depende', l.depende);
  set('l-capa',    l.coverUrl);
  set('l-isbn',    l.isbn);
  set('l-colecao', l.colecao);
  set('l-genero',  l.genero);
}

async function enviarLivro() {
  const btn = document.getElementById('l-btn');
  const livro = document.getElementById('l-livro').value;
  if (!livro) { mostrarMsg('l-msg', 'Selecione o livro!', 'err'); return; }

  const body = { acao: 'atualizarLivro', livro };
  const status  = document.getElementById('l-status').value;
  const autor   = document.getElementById('l-autor').value.trim();
  const paginas = document.getElementById('l-paginas').value;
  const metaAno = document.getElementById('l-metaano').value;
  const ordem   = document.getElementById('l-ordem').value;
  const depende = document.getElementById('l-depende').value.trim();
  const capa    = document.getElementById('l-capa').value.trim();
  const isbn    = document.getElementById('l-isbn').value.trim();
  const colecao = document.getElementById('l-colecao').value.trim();
  const genero  = document.getElementById('l-genero').value.trim();

  if (status)  body.status  = status;
  if (autor)   body.autor   = autor;
  if (paginas) body.paginas = Number(paginas);
  body.metaAno = metaAno; // sempre envia — vazio limpa a coluna P
  if (ordem)   body.ordem   = Number(ordem);
  if (depende) body.depende = depende;
  if (capa)    body.capa    = capa;
  if (isbn)    body.isbn    = isbn;
  if (colecao) body.colecao = colecao;
  if (genero)  body.genero  = genero;

  btn.disabled = true; btn.textContent = 'Atualizando...';
  try {
    const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify(body) });
    const d = await r.json();
    if (d.ok) {
      mostrarMsg('l-msg', '✅ ' + d.msg, 'ok');
      livrosCache = [];
      setTimeout(() => fecharModal('livro'), 2000);
      recarregarAteAtualizar((window._dadosD?.sessoes||[]).length);
    } else {
      mostrarMsg('l-msg', '❌ ' + (d.erro || 'Erro desconhecido'), 'err');
    }
  } catch(e) { mostrarMsg('l-msg', '❌ Erro de conexão', 'err'); }
  btn.disabled = false; btn.textContent = '✅ Atualizar';
}

function mostrarMsg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.textContent = texto;
  el.className = 'pwa-msg ' + tipo;
}

async function buscarLivroApi(prefix, acao) {
  const btn = document.getElementById(prefix + '-btn');
  const termo = document.getElementById(prefix + '-busca').value.trim();
  if (!termo) { mostrarMsg(prefix + '-msg', '⚠️ Digite um nome de livro ou ISBN', 'err'); return; }

  btn.disabled = true;
  btn.textContent = 'Buscando...';
  document.getElementById(prefix + '-resultado').style.display = 'none';
  mostrarMsg(prefix + '-msg', 'Buscando...', '');

  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ acao, termo })
    });
    const d = await r.json();
    if (d.ok) {
      const l = d.livro;
      document.getElementById(prefix + '-titulo').textContent = l.nome || '—';
      document.getElementById(prefix + '-autor').textContent = l.autor || '—';
      document.getElementById(prefix + '-capa').src = l.capa ? proxyUrl(l.capa) : '';
      document.getElementById(prefix + '-capa').onerror = function() {
        if (l.isbn && !this.dataset.fallback) {
          this.dataset.fallback = '1';
          this.src = `https://covers.openlibrary.org/b/isbn/${l.isbn}-L.jpg`;
        }
      };
      document.getElementById(prefix + '-out-nome').value = l.nome || '';
      document.getElementById(prefix + '-out-autor').value = l.autor || '';
      document.getElementById(prefix + '-out-paginas').value = l.paginas || '';
      document.getElementById(prefix + '-out-isbn').value = l.isbn || '';
      document.getElementById(prefix + '-out-capa').value = l.capa || '';
      document.getElementById(prefix + '-out-genero').value = l.genero || '';
      document.getElementById(prefix + '-out-colecao').value = l.colecao || '';
      document.getElementById(prefix + '-out-ordem').value = '';
      document.getElementById(prefix + '-out-metaano').value = '';
      document.getElementById(prefix + '-resultado').style.display = 'block';
      mostrarMsg(prefix + '-msg', '✅ Livro encontrado!', 'ok');
    } else {
      mostrarMsg(prefix + '-msg', '❌ ' + d.erro, 'err');
    }
  } catch(e) {
    mostrarMsg(prefix + '-msg', '❌ Erro de conexão', 'err');
  }
  btn.disabled = false;
  btn.textContent = '🔍 Buscar';
}
window.buscarLivroApi = buscarLivroApi;

async function buscarIsbndb() { return buscarLivroApi('isbndb', 'buscarIsbndb'); }
window.buscarIsbndb = buscarIsbndb;

async function buscarOpenLibrary() { return buscarLivroApi('ol', 'buscarOpenLibrary'); }
window.buscarOpenLibrary = buscarOpenLibrary;

async function enviarNovoLivro() {
  const btn = document.getElementById('nl-btn');
  const nome = document.getElementById('nl-nome').value.trim();
  if (!nome) { mostrarMsg('nl-msg', 'O nome do livro é obrigatório!', 'err'); return; }

  btn.disabled = true;
  btn.textContent = 'Adicionando...';
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        acao:    'adicionarLivro',
        nome,
        autor:   document.getElementById('nl-autor').value.trim(),
        paginas: Number(document.getElementById('nl-paginas').value) || 0,
        metaAno: document.getElementById('nl-metaano').value || '',
        ordem:   Number(document.getElementById('nl-ordem').value) || 0,
        colecao: document.getElementById('nl-colecao').value.trim(),
        depende: document.getElementById('nl-depende').value.trim(),
        capa:    document.getElementById('nl-capa').value.trim(),
        isbn:    document.getElementById('nl-isbn').value.trim(),
        genero:  document.getElementById('nl-genero').value.trim(),
        usuario: usuarioAtual === 'Batalha' ? 'Milton' : usuarioAtual,
      })
    });
    const d = await r.json();
    if (d.ok) {
      mostrarMsg('nl-msg', '✅ ' + d.msg, 'ok');
      recarregarAteAtualizar((window._dadosD?.sessoes||[]).length);
      livrosCache = []; // força reload na próxima abertura
      setTimeout(() => {
        fecharModal('novoLivro');
        // Limpa campos
        ['nl-nome','nl-colecao','nl-autor','nl-paginas','nl-metaano','nl-ordem','nl-depende','nl-capa','nl-isbn','nl-genero'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      }, 2000);
    } else {
      mostrarMsg('nl-msg', '❌ ' + d.erro, 'err');
    }
  } catch(e) {
    mostrarMsg('nl-msg', '❌ Erro de conexão', 'err');
  }
  btn.disabled = false;
  btn.textContent = '✅ Adicionar Livro';
}


// ════════════════════════════════════════════════
// BOOKLEGACY V6 — AÇÕES PRINCIPAIS NO FIRESTORE
// Substitui as chamadas antigas ao Apps Script, sem mudar os modais originais.
// ════════════════════════════════════════════════
function blFindLibraryByTitle(title){
  const raw = window.BL?.raw || {};
  return (raw.library||[]).find(x => blTxt(x.title || x.livro).toLowerCase() === blTxt(title).toLowerCase());
}
function blFindBookByTitle(title){
  const raw = window.BL?.raw || {};
  return (raw.books||[]).find(x => blTxt(x.title || x.livro).toLowerCase() === blTxt(title).toLowerCase());
}
async function blReloadAfterWrite(msgId, okMsg){
  if (msgId) mostrarMsg(msgId, okMsg || '✅ Salvo com sucesso!', 'ok');
  await blRefreshAndRender();
}
window.manualRefresh = async function(){ const btn=document.getElementById('btn-refresh'); if(btn)btn.textContent='⏳'; try{await blRefreshAndRender(); if(btn){btn.textContent='✅'; setTimeout(()=>btn.textContent='🔄',1200)}}catch(e){ if(btn){btn.textContent='❌'; setTimeout(()=>btn.textContent='🔄',1200)} } };
window.recarregarDados = async function(){ await blRefreshAndRender(); };
window.recarregarAteAtualizar = async function(){ await blRefreshAndRender(); };

window.enviarSessao = async function(){
  const btn=document.getElementById('s-btn'); const livro=document.getElementById('s-livro')?.value;
  const paginas=blNum(document.getElementById('s-paginas')?.value); const data=document.getElementById('s-data')?.value;
  if(!livro || !paginas || !data){ mostrarMsg('s-msg','Preencha livro, páginas e data.','err'); return; }
  btn.disabled=true; btn.textContent='Salvando...';
  try{
    const uid=window.BL.auth.currentUser.uid; const lib=blFindLibraryByTitle(livro); const book=blFindBookByTitle(livro);
    const minutos=blNum(document.getElementById('s-minutos')?.value)+blNum(document.getElementById('s-horas')?.value)*60;
    const segundos=blNum(document.getElementById('s-segundos')?.value);
    await window.BL.db.collection('users').doc(uid).collection('sessions').add({ bookId:lib?.bookId||book?.id||'', title:livro, collection:lib?.collection||book?.collection||'', date:data, pages:paginas, minutes:minutos, seconds:segundos, year:Number(data.slice(0,4)), createdAt:new Date().toISOString() });
    if(lib){
      const total=blNum(lib.totalPages||book?.pages); const newPage=blNum(lib.currentPage)+paginas;
      const upd={ currentPage: Math.min(total || newPage, newPage), updatedAt:new Date().toISOString() };
      if(total && newPage>=total){ upd.status='Completo'; upd.completionYear=String(data.slice(0,4)); upd.progress=1; } else if (lib.status==='Aguardando') { upd.status='Lendo'; }
      await window.BL.db.collection('users').doc(uid).collection('library').doc(lib.id).set(upd,{merge:true});
    }
    await blReloadAfterWrite('s-msg','✅ Sessão salva no Firebase!'); setTimeout(()=>fecharModal('sessao'),1000);
  }catch(e){ mostrarMsg('s-msg','❌ '+e.message,'err'); }
  btn.disabled=false; btn.textContent='✅ Salvar Sessão';
};

window.enviarNota = async function(){
  const btn=document.getElementById('n-btn'); const livro=document.getElementById('n-livro')?.value;
  if(!livro){ mostrarMsg('n-msg','Selecione o livro.','err'); return; }
  btn.disabled=true; btn.textContent='Salvando...';
  try{
    const uid=window.BL.auth.currentUser.uid; const lib=blFindLibraryByTitle(livro); const critKeys=['dialogos','enredo','estiloVisual','finalizacao','imersao','impactoEmocional','originalidade','personagens','ritmo','temas'];
    const data={ bookId:lib?.bookId||'', title:livro, readingYear:blNum(document.getElementById('n-ano')?.value)||new Date().getFullYear(), updatedAt:new Date().toISOString() };
    let vals=[]; critKeys.forEach((k,i)=>{ const v=blNum(document.getElementById('n-'+i)?.value); if(v>0){ data[k]=v; vals.push(v); } });
    data.notaFinal=vals.length?Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)):0; data.notaPonderada=data.notaFinal;
    await window.BL.db.collection('users').doc(uid).collection('ratings').doc('rat_'+blSlug(livro)+'_'+data.readingYear).set(data,{merge:true});
    await blReloadAfterWrite('n-msg','✅ Avaliação salva no Firebase!'); setTimeout(()=>fecharModal('nota'),1000);
  }catch(e){ mostrarMsg('n-msg','❌ '+e.message,'err'); }
  btn.disabled=false; btn.textContent='✅ Salvar Avaliação';
};

window.enviarLivro = async function(){
  const btn=document.getElementById('l-btn'); const livro=document.getElementById('l-livro')?.value;
  if(!livro){ mostrarMsg('l-msg','Selecione o livro.','err'); return; }
  btn.disabled=true; btn.textContent='Atualizando...';
  try{
    const uid=window.BL.auth.currentUser.uid; const lib=blFindLibraryByTitle(livro); if(!lib) throw new Error('Livro não encontrado na biblioteca.');
    const data={ updatedAt:new Date().toISOString() };
    const fields=[['status','l-status'],['author','l-autor'],['targetYear','l-metaano'],['dependency','l-depende'],['coverUrl','l-capa'],['isbn','l-isbn'],['collection','l-colecao'],['genre','l-genero']];
    fields.forEach(([k,id])=>{ const el=document.getElementById(id); if(el) data[k]=el.value.trim(); });
    const pages=blNum(document.getElementById('l-paginas')?.value); if(pages) data.totalPages=pages;
    const ord=blNum(document.getElementById('l-ordem')?.value); if(ord) data.collectionOrder=ord;
    await window.BL.db.collection('users').doc(uid).collection('library').doc(lib.id).set(data,{merge:true});
    if(lib.bookId){ await window.BL.db.collection('books').doc(lib.bookId).set({ title:livro, author:data.author||lib.author||'', pages:pages||lib.totalPages||0, coverUrl:data.coverUrl||lib.coverUrl||'', isbn:data.isbn||lib.isbn||'', collection:data.collection||lib.collection||'', genre:data.genre||lib.genre||'', updatedAt:new Date().toISOString() },{merge:true}); }
    await blReloadAfterWrite('l-msg','✅ Livro atualizado no Firebase!'); setTimeout(()=>fecharModal('livro'),1000);
  }catch(e){ mostrarMsg('l-msg','❌ '+e.message,'err'); }
  btn.disabled=false; btn.textContent='✅ Atualizar';
};

window.enviarNovoLivro = async function(){
  const btn=document.getElementById('nl-btn'); const nome=document.getElementById('nl-nome')?.value.trim();
  if(!nome){ mostrarMsg('nl-msg','O nome do livro é obrigatório.','err'); return; }
  btn.disabled=true; btn.textContent='Adicionando...';
  try{
    const uid=window.BL.auth.currentUser.uid; const bookId='book_'+blSlug(nome); const now=new Date().toISOString();
    const book={ title:nome, normalizedTitle:blSlug(nome), author:document.getElementById('nl-autor')?.value.trim()||'', pages:blNum(document.getElementById('nl-paginas')?.value), coverUrl:document.getElementById('nl-capa')?.value.trim()||'', isbn:document.getElementById('nl-isbn')?.value.trim()||'', collection:document.getElementById('nl-colecao')?.value.trim()||'', genre:document.getElementById('nl-genero')?.value.trim()||'', source:(window.__nlSource||nlModoSelecionado?.()||'manual'), createdBy:uid, updatedAt:now };
    await window.BL.db.collection('books').doc(bookId).set(book,{merge:true});
    await window.BL.db.collection('users').doc(uid).collection('library').doc('lib_'+blSlug(nome)).set({ bookId, title:nome, author:book.author, collection:book.collection, genre:book.genre, status:'Aguardando', targetYear:document.getElementById('nl-metaano')?.value||'', dependency:document.getElementById('nl-depende')?.value.trim()||'', collectionOrder:blNum(document.getElementById('nl-ordem')?.value), totalPages:book.pages, currentPage:0, coverUrl:book.coverUrl, isbn:book.isbn, createdAt:now, updatedAt:now },{merge:true});
    await blReloadAfterWrite('nl-msg','✅ Livro adicionado ao Firebase!'); setTimeout(()=>fecharModal('novoLivro'),1000);
  }catch(e){ mostrarMsg('nl-msg','❌ '+e.message,'err'); }
  btn.disabled=false; btn.textContent='✅ Adicionar Livro';
};

window.confirmarExcluir = async function(){
  const livro=document.getElementById('ex-livro')?.value; if(!livro){ mostrarMsg('ex-msg','Selecione um livro.','err'); return; }
  const lib=blFindLibraryByTitle(livro); if(!lib){ mostrarMsg('ex-msg','Livro não encontrado.','err'); return; }
  try{ const uid=window.BL.auth.currentUser.uid; await window.BL.db.collection('users').doc(uid).collection('library').doc(lib.id).delete(); await blReloadAfterWrite('ex-msg','✅ Removido da sua biblioteca.'); setTimeout(()=>fecharModal('excluir'),1000); }
  catch(e){ mostrarMsg('ex-msg','❌ '+e.message,'err'); }
};

window.buscarOpenLibrary = async function(){ return blBuscarLivroPublico('ol'); };
window.buscarIsbndb = async function(){ return blBuscarLivroPublico('isbndb'); };
async function blBuscarLivroPublico(prefix){
  const termo=document.getElementById(prefix+'-busca')?.value.trim(); if(!termo){ mostrarMsg(prefix+'-msg','Digite um nome ou ISBN.','err'); return; }
  const btn=document.getElementById(prefix+'-btn'); btn.disabled=true; btn.textContent='Buscando...';
  try{
    const r=await fetch('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(termo)+'&maxResults=1'); const j=await r.json(); const it=j.items?.[0]?.volumeInfo; if(!it) throw new Error('Livro não encontrado.');
    const ids=it.industryIdentifiers||[]; const isbn=(ids.find(x=>x.type==='ISBN_13')||ids[0]||{}).identifier||''; const l={ nome:it.title||termo, autor:(it.authors||[]).join(', '), paginas:it.pageCount||'', isbn, capa:(it.imageLinks?.thumbnail||'').replace('http://','https://'), genero:(it.categories||[])[0]||'', colecao:'' };
    document.getElementById(prefix+'-titulo').textContent=l.nome; document.getElementById(prefix+'-autor').textContent=l.autor||'—'; document.getElementById(prefix+'-capa').src=l.capa||'';
    ['nome','autor','paginas','isbn','capa','genero','colecao'].forEach(k=>{ const el=document.getElementById(prefix+'-out-'+k); if(el) el.value=l[k]||''; });
    const ord=document.getElementById(prefix+'-out-ordem'); if(ord) ord.value=''; const meta=document.getElementById(prefix+'-out-metaano'); if(meta) meta.value='';
    document.getElementById(prefix+'-resultado').style.display='block'; mostrarMsg(prefix+'-msg','✅ Livro encontrado pela API pública.','ok');
  }catch(e){ mostrarMsg(prefix+'-msg','❌ '+e.message,'err'); }
  btn.disabled=false; btn.textContent='🔍 Buscar';
}



/* ===== V7.7 - Correções sessão + adicionar livro por API integrada ===== */
function blCurrentUid(){ return window.BL?.auth?.currentUser?.uid || null; }
function blSessionCollection(){ const uid=blCurrentUid(); if(!uid) throw new Error('Usuário não logado.'); return window.BL.db.collection('users').doc(uid).collection('sessions'); }
function blLibraryCollection(){ const uid=blCurrentUid(); if(!uid) throw new Error('Usuário não logado.'); return window.BL.db.collection('users').doc(uid).collection('library'); }
async function blFindSessionDoc(s){
  const col=blSessionCollection();
  if(s?.id){ const ref=col.doc(s.id); const snap=await ref.get(); if(snap.exists) return {ref, data:{id:snap.id,...snap.data()}}; }
  let q=col.where('date','==',s.data).where('pages','==',Number(s.paginas||s.pages||0)).limit(10);
  const snap=await q.get();
  const titleNorm=blNormalizeText(s.livro||s.title||'');
  for(const d of snap.docs){ const data=d.data(); if(blNormalizeText(data.title||data.livro||'')===titleNorm) return {ref:d.ref, data:{id:d.id,...data}}; }
  throw new Error('Sessão não encontrada no Firestore. Atualize a página e tente novamente.');
}
function blFindLibByBookOrTitle(bookId,title){
  const raw=(window.BL?.raw?.users?.[0]?.library)||[];
  return raw.find(l => (bookId && l.bookId===bookId) || blNormalizeText(l.title||l.livro||'')===blNormalizeText(title||''));
}
async function blAdjustLibraryPages(bookId,title,delta,newDate){
  const lib=blFindLibByBookOrTitle(bookId,title); if(!lib?.id || !delta) return;
  const ref=blLibraryCollection().doc(lib.id);
  const current=blNum(lib.currentPage||lib.pagAtual); const total=blNum(lib.totalPages||lib.pages||lib.totalPag);
  const next=Math.max(0, total?Math.min(total,current+delta):current+delta);
  const upd={currentPage:next, updatedAt:new Date().toISOString()};
  if(total && next>=total){ upd.status='Completo'; if(newDate) upd.completionYear=String(newDate).slice(0,4); upd.progress=1; }
  else if(lib.status==='Completo' && total && next<total){ upd.status='Lendo'; upd.progress=total?next/total:0; }
  else if(total){ upd.progress=next/total; }
  await ref.set(upd,{merge:true});
}
window.renderSessoesExcluir = function(){
  const filtro=(document.getElementById('es-filtro')?.value||'').toLowerCase();
  const sessoes=[...(window._sessoes||[])]
    .filter(s=>!filtro || String(s.livro||'').toLowerCase().includes(filtro))
    .sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).slice(0,80);
  const lista=document.getElementById('es-lista'); if(!lista) return; lista.innerHTML='';
  if(!sessoes.length){ lista.innerHTML='<div style="color:var(--muted);text-align:center;padding:16px;">Nenhuma sessão encontrada</div>'; return; }
  sessoes.forEach(s=>{
    const div=document.createElement('div');
    div.style.cssText='display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;';
    div.innerHTML=`<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.livro||s.title||''}</div><div style="font-size:12px;color:var(--muted);">${s.data||''} · ${s.paginas||s.pages||0} págs${s.minutos?' · '+Math.round(s.minutos)+'min':''}</div></div><button class="es-edit-btn" style="background:var(--purple);border:none;color:white;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;">✏️</button><button class="es-del-btn" style="background:#e53935;border:none;color:white;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;">🗑️</button>`;
    div.querySelector('.es-edit-btn').onclick=()=>editarSessaoDesktop(s);
    div.querySelector('.es-del-btn').onclick=()=>excluirSessao(s);
    lista.appendChild(div);
  });
};
window.editarSessaoDesktop = function(s){
  fecharModal('excluirSessao');
  const ensureHidden=(id)=>{let el=document.getElementById(id); if(!el){ el=document.createElement('input'); el.type='hidden'; el.id=id; document.getElementById('modalEditarSessao')?.appendChild(el);} return el;};
  ensureHidden('ee-session-id').value=s.id||''; ensureHidden('ee-book-id').value=s.bookId||'';
  document.getElementById('ee-livro-original').value=s.livro||s.title||'';
  document.getElementById('ee-data-original').value=s.data||'';
  document.getElementById('ee-paginas-original').value=s.paginas||s.pages||0;
  document.getElementById('ee-livro-nome').textContent=s.livro||s.title||'';
  document.getElementById('ee-data').value=s.data||'';
  document.getElementById('ee-paginas').value=s.paginas||s.pages||0;
  const mins=blNum(s.minutos||s.minutes); document.getElementById('ee-horas').value=mins?Math.floor(mins/60):''; document.getElementById('ee-minutos').value=mins?Math.round(mins%60):'';
  const msg=document.getElementById('ee-msg'); if(msg){msg.className='pwa-msg'; msg.textContent='';}
  abrirModal('editarSessao');
};
window.salvarEdicaoSessao = async function(){
  const btn=document.getElementById('ee-btn'); const oldText=btn?.textContent||'💾 Salvar alterações';
  const sess={id:document.getElementById('ee-session-id')?.value, bookId:document.getElementById('ee-book-id')?.value, livro:document.getElementById('ee-livro-original')?.value, data:document.getElementById('ee-data-original')?.value, paginas:blNum(document.getElementById('ee-paginas-original')?.value)};
  const novaData=document.getElementById('ee-data')?.value; const novasPaginas=blNum(document.getElementById('ee-paginas')?.value); const totalMinutos=blNum(document.getElementById('ee-horas')?.value)*60+blNum(document.getElementById('ee-minutos')?.value);
  if(!novaData||!novasPaginas){mostrarMsg('ee-msg','⚠️ Preencha data e páginas.','err');return;}
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  try{
    const found=await blFindSessionDoc(sess); const oldPages=blNum(found.data.pages||found.data.paginas);
    await found.ref.set({date:novaData,pages:novasPaginas,minutes:totalMinutos,year:Number(String(novaData).slice(0,4)),updatedAt:new Date().toISOString()},{merge:true});
    await blAdjustLibraryPages(found.data.bookId||sess.bookId,found.data.title||sess.livro,novasPaginas-oldPages,novaData);
    mostrarMsg('ee-msg','✅ Sessão editada no Firebase!','ok'); await blRefreshAndRender(); setTimeout(()=>fecharModal('editarSessao'),900);
  }catch(e){mostrarMsg('ee-msg','❌ '+e.message,'err');}
  if(btn){btn.disabled=false;btn.textContent=oldText;}
};
window.excluirSessao = async function(sOrLivro,data,paginas){
  const s=typeof sOrLivro==='object'?sOrLivro:{livro:sOrLivro,data,paginas};
  if(!confirm(`Excluir sessão de "${s.livro||s.title}" em ${s.data}?`)) return;
  try{
    const found=await blFindSessionDoc(s); await found.ref.delete();
    await blAdjustLibraryPages(found.data.bookId||s.bookId,found.data.title||s.livro,-blNum(found.data.pages||found.data.paginas),found.data.date||s.data);
    window._sessoes=(window._sessoes||[]).filter(x=>x.id!==found.data.id);
    mostrarMsg('es-msg','✅ Sessão excluída no Firebase!','ok'); renderSessoesExcluir(); await blRefreshAndRender();
  }catch(e){mostrarMsg('es-msg','❌ '+e.message,'err');}
};
function nlModoSelecionado(){return document.querySelector('input[name="nl-api-mode"]:checked')?.value||'manual';}
window.nlModoApiMudou=function(){ const mode=nlModoSelecionado(); const b=document.getElementById('nl-api-buscar'); const st=document.getElementById('nl-api-status'); if(b)b.style.display=mode==='manual'?'none':'inline-block'; if(st)st.textContent=mode==='manual'?'Cadastro manual ativo.':'Digite o nome/ISBN para buscar pela API selecionada.'; if(mode!=='manual') nlBuscarSeApiSelecionada(); };
let nlApiTimer=null; window.nlAgendarBuscaApi=function(){ clearTimeout(nlApiTimer); if(nlModoSelecionado()==='manual') return; nlApiTimer=setTimeout(()=>nlBuscarSeApiSelecionada(),900); };
window.nlBuscarSeApiSelecionada=async function(force=false){ const mode=nlModoSelecionado(); if(mode==='manual') return; const termo=document.getElementById('nl-nome')?.value.trim(); const st=document.getElementById('nl-api-status'); const btn=document.getElementById('nl-api-buscar'); if(!termo){ if(st)st.textContent='Digite o nome/ISBN do livro.'; return; } if(btn){btn.disabled=true;btn.textContent='Buscando...';} if(st)st.textContent='Buscando dados...'; try{ const l= mode==='openlibrary'? await blFetchOpenLibraryBook(termo): await blFetchIsbndbBook(termo); blPreencherNovoLivro(l,mode); if(st)st.textContent='✅ Dados encontrados. Revise e salve.'; }catch(e){ if(st)st.textContent='⚠️ '+e.message+' Você pode preencher manualmente.'; } if(btn){btn.disabled=false;btn.textContent='🔎 Buscar dados';} };
function blPreencherNovoLivro(l,source){ const set=(id,v)=>{const el=document.getElementById(id); if(el && (v!==undefined&&v!==null)) el.value=v||'';}; set('nl-nome',l.nome); set('nl-autor',l.autor); set('nl-paginas',l.paginas); set('nl-isbn',l.isbn); set('nl-capa',l.capa); set('nl-genero',l.genero); if(l.colecao) set('nl-colecao',l.colecao); window.__nlSource=source; }
async function blFetchOpenLibraryBook(termo){ const isIsbn=/^[0-9Xx-]{10,17}$/.test(termo.replace(/\s/g,'')); let doc=null,isbn=''; if(isIsbn){ isbn=termo.replace(/[^0-9Xx]/g,''); const r=await fetch('https://openlibrary.org/isbn/'+isbn+'.json'); if(!r.ok) throw new Error('Open Library não encontrou esse ISBN.'); doc=await r.json(); } else { const r=await fetch('https://openlibrary.org/search.json?title='+encodeURIComponent(termo)+'&limit=1'); const j=await r.json(); const hit=j.docs?.[0]; if(!hit) throw new Error('Open Library não encontrou esse livro.'); doc=hit; isbn=(hit.isbn||[])[0]||''; } let autor=''; if(doc.authors?.[0]?.key){ try{ const ar=await fetch('https://openlibrary.org'+doc.authors[0].key+'.json'); const aj=await ar.json(); autor=aj.name||''; }catch{} } else autor=(doc.author_name||[]).join(', '); return {nome:doc.title||termo, autor, paginas:doc.number_of_pages||doc.number_of_pages_median||'', isbn, capa: isbn?`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`:(doc.cover_i?`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`:''), genero:(doc.subject||doc.subject_facet||[])[0]||'', colecao:(doc.series||[])[0]||''}; }
async function blFetchIsbndbBook(termo){ const key=window.ISBNDB_API_KEY||window.VITE_ISBNDB_API_KEY||''; if(key){ const isIsbn=/^[0-9Xx-]{10,17}$/.test(termo.replace(/\s/g,'')); const url=isIsbn?'https://api2.isbndb.com/book/'+termo.replace(/[^0-9Xx]/g,''):'https://api2.isbndb.com/books/'+encodeURIComponent(termo)+'?page=1&pageSize=1'; const r=await fetch(url,{headers:{Authorization:key}}); if(r.ok){ const j=await r.json(); const b=j.book||(j.books||[])[0]; if(b) return {nome:b.title||termo, autor:(b.authors||[]).join(', '), paginas:b.pages||'', isbn:b.isbn13||b.isbn||'', capa:b.image||'', genero:(b.subjects||[])[0]||'', colecao:''}; } }
  const r=await fetch('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(termo)+'&maxResults=1'); const j=await r.json(); const it=j.items?.[0]?.volumeInfo; if(!it) throw new Error('ISBNdb/Google Books não encontrou esse livro.'); const ids=it.industryIdentifiers||[]; const isbn=(ids.find(x=>x.type==='ISBN_13')||ids[0]||{}).identifier||''; return {nome:it.title||termo, autor:(it.authors||[]).join(', '), paginas:it.pageCount||'', isbn, capa:(it.imageLinks?.thumbnail||'').replace('http://','https://'), genero:(it.categories||[])[0]||'', colecao:''}; }
const _oldEnviarNovoLivro=window.enviarNovoLivro; window.enviarNovoLivro=async function(){ const source=nlModoSelecionado(); const btn=document.getElementById('nl-btn'); const nome=document.getElementById('nl-nome')?.value.trim(); if(source!=='manual' && nome && !document.getElementById('nl-autor')?.value.trim() && !document.getElementById('nl-paginas')?.value.trim()){ await nlBuscarSeApiSelecionada(true); } return _oldEnviarNovoLivro(); };


// Service Worker para PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
