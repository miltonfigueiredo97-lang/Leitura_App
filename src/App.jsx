import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase.js';

const MAX_BATCH_OPS = 450;

function cleanDoc(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function statusKey(value) {
  return String(value || '').trim().toLowerCase();
}

function fmtNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(n(value)));
}

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function clampPct(value) {
  return Math.max(0, Math.min(100, Math.round(n(value))));
}

async function ensureUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  const base = {
    name: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: 'user',
    plan: 'free',
    uid: user.uid,
    updatedAt: now,
  };
  await setDoc(ref, snap.exists() ? base : { ...base, createdAt: now }, { merge: true });
}

async function commitOperations(ops, onProgress) {
  let committed = 0;
  for (let i = 0; i < ops.length; i += MAX_BATCH_OPS) {
    const batch = writeBatch(db);
    const chunk = ops.slice(i, i + MAX_BATCH_OPS);
    chunk.forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
    committed += chunk.length;
    onProgress?.(committed, ops.length);
  }
}

function LoginScreen({ onLogin, error }) {
  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="logo">📚</div>
        <p className="eyebrow">BookLegacy</p>
        <h1>Seu app global de leitura começa aqui.</h1>
        <p className="muted">Entre com Google para acessar sua biblioteca segura no Firebase.</p>
        <button className="primary" onClick={onLogin}>Entrar com Google</button>
        {error && <p className="error-text">{error}</p>}
      </section>
    </main>
  );
}

function Topbar({ user, activeTab, setActiveTab }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">BookLegacy</p>
        <h1>Dashboard de leitura</h1>
        <p className="muted">Primeira versão lendo dados reais do Firestore.</p>
        <nav className="tabs">
          <button className={activeTab === 'dashboard' ? 'on' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={activeTab === 'library' ? 'on' : ''} onClick={() => setActiveTab('library')}>Biblioteca</button>
          <button className={activeTab === 'migration' ? 'on' : ''} onClick={() => setActiveTab('migration')}>Migração</button>
        </nav>
      </div>
      <div className="profile">
        {user.photoURL && <img src={user.photoURL} alt="Foto do usuário" />}
        <div>
          <strong>{user.displayName || 'Usuário'}</strong>
          <span>{user.email}</span>
          <code>{user.uid}</code>
        </div>
        <button className="ghost" onClick={() => signOut(auth)}>Sair</button>
      </div>
    </header>
  );
}

function Kpi({ icon, value, label, sub }) {
  return (
    <article className="kpi">
      <span className="kpi-icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
      {sub && <small>{sub}</small>}
    </article>
  );
}

function EmptyState({ title, text }) {
  return (
    <section className="card empty-state">
      <h2>{title}</h2>
      <p className="muted">{text}</p>
    </section>
  );
}

function LoadingCard() {
  return <div className="center-screen"><div className="loader" />Carregando dados do Firestore...</div>;
}

function useReadingData(user) {
  const [state, setState] = useState({ loading: true, error: '', books: [], library: [], sessions: [], ratings: [], goals: [], collections: [] });

  async function load() {
    if (!user) return;
    setState((old) => ({ ...old, loading: true, error: '' }));
    try {
      const [booksSnap, librarySnap, sessionsSnap, ratingsSnap, goalsSnap, collectionsSnap] = await Promise.all([
        getDocs(collection(db, 'books')),
        getDocs(collection(db, 'users', user.uid, 'library')),
        getDocs(collection(db, 'users', user.uid, 'sessions')),
        getDocs(collection(db, 'users', user.uid, 'ratings')),
        getDocs(collection(db, 'users', user.uid, 'goals')),
        getDocs(collection(db, 'users', user.uid, 'collections')),
      ]);

      const mapSnap = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setState({
        loading: false,
        error: '',
        books: mapSnap(booksSnap),
        library: mapSnap(librarySnap),
        sessions: mapSnap(sessionsSnap),
        ratings: mapSnap(ratingsSnap),
        goals: mapSnap(goalsSnap),
        collections: mapSnap(collectionsSnap),
      });
    } catch (error) {
      setState((old) => ({ ...old, loading: false, error: error.message }));
    }
  }

  useEffect(() => { load(); }, [user?.uid]);
  return { ...state, reload: load };
}

function itemYear(item) {
  return String(item.targetYear || item.completionYear || '').trim();
}

function isCompleted(item) {
  return ['completo', 'lido', 'finalizado'].includes(statusKey(item.status)) || n(item.progress) >= 1;
}

function isReading(item) {
  return ['lendo', 'em leitura'].includes(statusKey(item.status));
}

function isPaused(item) {
  return ['pausado', 'pausados'].includes(statusKey(item.status));
}

function isWaiting(item) {
  return ['aguardando', 'pendente', 'planejado'].includes(statusKey(item.status));
}

function getAvailableYears(data) {
  const years = new Set();
  data.goals.forEach((g) => { if (n(g.year)) years.add(String(g.year)); });
  data.library.forEach((item) => {
    const y = itemYear(item);
    if (/^\d{4}$/.test(y)) years.add(y);
  });
  data.sessions.forEach((s) => {
    const y = s.year || String(s.date || '').slice(0, 4);
    if (/^\d{4}$/.test(String(y))) years.add(String(y));
  });
  return [...years].sort((a, b) => Number(b) - Number(a));
}

function filterByYear(data, yearFilter) {
  if (yearFilter === 'all') return data;
  const year = String(yearFilter);
  return {
    ...data,
    library: data.library.filter((item) => itemYear(item) === year),
    sessions: data.sessions.filter((s) => String(s.year || String(s.date || '').slice(0, 4)) === year),
    ratings: data.ratings.filter((r) => String(r.readingYear || '') === year),
  };
}

function buildStats(data, yearFilter) {
  const scoped = filterByYear(data, yearFilter);
  const { library, sessions, ratings, goals, collections } = scoped;
  const activeLibrary = library.filter((item) => !isPaused(item));
  const completed = library.filter(isCompleted);
  const reading = library.filter(isReading);
  const paused = library.filter(isPaused);
  const waiting = library.filter(isWaiting);

  // Regra igual ao dashboard antigo:
  // - Visão anual/meta usa progresso do cadastro do livro: currentPage/totalPages.
  // - Visão geral de páginas lidas usa o histórico de sessões.
  const libraryPagesRead = activeLibrary.reduce((acc, item) => acc + n(item.currentPage), 0);
  const libraryTotalPages = activeLibrary.reduce((acc, item) => acc + n(item.totalPages || item.pages), 0);
  const sessionPages = sessions.reduce((acc, item) => acc + n(item.pages), 0);
  const minutes = sessions.reduce((acc, item) => acc + n(item.minutes), 0);

  const currentYear = new Date().getFullYear();
  const selectedYear = yearFilter === 'all' ? String(currentYear) : String(yearFilter);
  const goal = data.goals.find((g) => String(g.year) === selectedYear);

  // Para metas, a planilha real bate melhor pelo conjunto targetYear do que pelo resumo antigo metaPorAno.
  const goalBooks = yearFilter === 'all' ? activeLibrary.length : activeLibrary.length || n(goal?.booksGoal || goal?.raw?.total);
  const goalPages = yearFilter === 'all' ? libraryTotalPages : libraryTotalPages || n(goal?.pagesGoal || goal?.raw?.paginasTotal);
  const booksGoalPct = goalBooks ? clampPct((completed.filter((item) => !isPaused(item)).length / goalBooks) * 100) : 0;
  const pagesGoalPct = goalPages ? clampPct((libraryPagesRead / goalPages) * 100) : 0;
  const avgRating = ratings.length ? ratings.reduce((acc, r) => acc + n(r.notaPonderada || r.notaFinal), 0) / ratings.length : 0;

  return {
    total: activeLibrary.length,
    completed: completed.filter((item) => !isPaused(item)).length,
    reading: reading.length,
    paused: paused.length,
    waiting: waiting.length,
    pagesRead: yearFilter === 'all' ? sessionPages : libraryPagesRead,
    libraryPagesRead,
    libraryTotalPages,
    sessionPages,
    minutes,
    sessions: sessions.length,
    ratings: ratings.length,
    collections: yearFilter === 'all' ? data.collections.length : new Set(activeLibrary.map((i) => i.collection).filter(Boolean)).size,
    avgRating,
    goalYear: yearFilter === 'all' ? 'Todos os anos' : selectedYear,
    goalBooks,
    goalPages,
    booksGoalPct,
    pagesGoalPct,
  };
}

function DashboardView({ data, reload }) {
  const years = useMemo(() => getAvailableYears(data), [data]);
  const defaultYear = years.includes(String(new Date().getFullYear())) ? String(new Date().getFullYear()) : (years[0] || 'all');
  const [yearFilter, setYearFilter] = useState(defaultYear);

  useEffect(() => {
    if (yearFilter !== 'all' && years.length && !years.includes(yearFilter)) setYearFilter(defaultYear);
  }, [years.join('|')]);

  const scopedData = useMemo(() => filterByYear(data, yearFilter), [data, yearFilter]);
  const stats = useMemo(() => buildStats(data, yearFilter), [data, yearFilter]);
  const recentSessions = useMemo(() => [...scopedData.sessions].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 8), [scopedData.sessions]);
  const topRatings = useMemo(() => [...scopedData.ratings].sort((a, b) => n(b.notaPonderada || b.notaFinal) - n(a.notaPonderada || a.notaFinal)).slice(0, 8), [scopedData.ratings]);
  const readingNow = useMemo(() => scopedData.library.filter(isReading).slice(0, 6), [scopedData.library]);

  if (!data.library.length && !data.sessions.length) {
    return <EmptyState title="Sua base ainda não apareceu no dashboard" text="Use a aba Migração ou confira se os documentos estão dentro do seu usuário no Firestore." />;
  }

  return (
    <>
      <section className="card filter-card">
        <div>
          <span className="pill">Correção de dados</span>
          <h2>Filtro principal do dashboard</h2>
          <p className="muted">Agora os números usam a mesma lógica da planilha: por ano/meta quando selecionado, histórico quando escolher todos.</p>
        </div>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
          <option value="all">Todos os anos</option>
        </select>
      </section>

      <section className="kpi-grid">
        <Kpi icon="📚" value={fmtNumber(stats.total)} label={yearFilter === 'all' ? 'Livros ativos na biblioteca' : `Livros da meta ${yearFilter}`} sub={`${fmtNumber(stats.completed)} concluídos`} />
        <Kpi icon="📖" value={fmtNumber(stats.reading)} label="Lendo agora" sub={`${fmtNumber(stats.waiting)} aguardando`} />
        <Kpi icon="📄" value={fmtNumber(stats.pagesRead)} label="Páginas lidas" sub={yearFilter === 'all' ? `${fmtNumber(stats.sessionPages)} por sessões` : `${fmtNumber(stats.libraryTotalPages)} páginas da meta`} />
        <Kpi icon="⏱️" value={fmtNumber(stats.sessions)} label="Sessões registradas" sub={`${fmtNumber(stats.minutes)} minutos`} />
        <Kpi icon="⭐" value={stats.avgRating.toFixed(2)} label="Média das notas" sub={`${fmtNumber(stats.ratings)} avaliações`} />
        <Kpi icon="🧩" value={fmtNumber(stats.collections)} label="Coleções/Sagas" sub={yearFilter === 'all' ? 'Histórico importado' : `Presentes em ${yearFilter}`} />
      </section>

      <section className="grid2">
        <article className="card">
          <div className="card-title-row">
            <div>
              <span className="pill">{yearFilter === 'all' ? 'Histórico' : `Meta ${yearFilter}`}</span>
              <h2>Progresso anual</h2>
            </div>
            <button className="ghost" onClick={reload}>Atualizar</button>
          </div>
          <div className="goal-box">
            <div>
              <strong>{stats.booksGoalPct}%</strong>
              <span>{fmtNumber(stats.completed)} de {fmtNumber(stats.goalBooks)} livros</span>
              <div className="progress-wrap"><div className="progress-bar" style={{ width: `${stats.booksGoalPct}%` }} /></div>
            </div>
            <div>
              <strong>{stats.pagesGoalPct}%</strong>
              <span>{fmtNumber(stats.libraryPagesRead)} de {fmtNumber(stats.goalPages)} páginas</span>
              <div className="progress-wrap"><div className="progress-bar alt" style={{ width: `${stats.pagesGoalPct}%` }} /></div>
            </div>
          </div>
        </article>

        <article className="card">
          <span className="pill">Status</span>
          <h2>Distribuição da biblioteca</h2>
          <div className="status-list">
            <StatusLine label="Concluídos" value={stats.completed} total={stats.total} />
            <StatusLine label="Lendo" value={stats.reading} total={stats.total} />
            <StatusLine label="Aguardando" value={stats.waiting} total={stats.total} />
            <StatusLine label="Pausados" value={stats.paused} total={stats.total + stats.paused} />
          </div>
        </article>
      </section>

      <section className="grid3">
        <ListCard title="Lendo agora" badge="Atual" items={readingNow} empty="Nenhum livro marcado como lendo neste filtro.">
          {(item) => <BookRow item={item} right={`${clampPct(n(item.progress) * 100)}%`} />}
        </ListCard>
        <ListCard title="Últimas sessões" badge="Histórico" items={recentSessions} empty="Nenhuma sessão encontrada neste filtro.">
          {(item) => <SimpleRow title={item.title} sub={`${fmtDate(item.date)} • ${fmtNumber(item.pages)} págs • ${fmtNumber(item.minutes)} min`} right={item.collection} />}
        </ListCard>
        <ListCard title="Top notas" badge="Ranking" items={topRatings} empty="Nenhuma nota encontrada neste filtro.">
          {(item) => <SimpleRow title={item.title} sub={`Ano ${item.readingYear || '—'}`} right={Number(n(item.notaPonderada || item.notaFinal)).toFixed(2)} />}
        </ListCard>
      </section>
    </>
  );
}

function StatusLine({ label, value, total }) {
  const pct = total ? clampPct((value / total) * 100) : 0;
  return (
    <div className="status-line">
      <div><strong>{label}</strong><span>{fmtNumber(value)} livros</span></div>
      <div className="progress-wrap"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
      <b>{pct}%</b>
    </div>
  );
}

function ListCard({ title, badge, items, empty, children }) {
  return (
    <article className="card list-card">
      <span className="pill">{badge}</span>
      <h2>{title}</h2>
      <div className="row-list">
        {items.length ? items.map((item) => <div key={item.id} className="list-row">{children(item)}</div>) : <p className="muted">{empty}</p>}
      </div>
    </article>
  );
}

function SimpleRow({ title, sub, right }) {
  return (
    <>
      <div className="row-main"><strong>{title || 'Sem título'}</strong><span>{sub}</span></div>
      <em>{right || '—'}</em>
    </>
  );
}

function BookRow({ item, right }) {
  return (
    <>
      {item.coverUrl ? <img className="mini-cover" src={item.coverUrl} alt="" /> : <div className="cover-fallback">📚</div>}
      <div className="row-main"><strong>{item.title || 'Sem título'}</strong><span>{item.author || item.collection || '—'}</span></div>
      <em>{right}</em>
    </>
  );
}

function LibraryView({ data }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.library]
      .filter((item) => status === 'todos' || statusKey(item.status) === status)
      .filter((item) => !q || `${item.title} ${item.author} ${item.collection} ${item.genre}`.toLowerCase().includes(q))
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
      .slice(0, 120);
  }, [data.library, query, status]);

  return (
    <section className="card">
      <div className="card-title-row">
        <div>
          <span className="pill">Biblioteca</span>
          <h2>Livros importados</h2>
          <p className="muted">Primeira tela de consulta. Edição/cadastro entra nos próximos passos.</p>
        </div>
        <strong>{fmtNumber(filtered.length)} exibidos</strong>
      </div>
      <div className="filters">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por livro, autor, coleção ou gênero" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="completo">Completo</option>
          <option value="lendo">Lendo</option>
          <option value="aguardando">Aguardando</option>
          <option value="pausado">Pausado</option>
        </select>
      </div>
      <div className="book-grid">
        {filtered.map((item) => (
          <article className="book-card" key={item.id}>
            {item.coverUrl ? <img src={item.coverUrl} alt={`Capa de ${item.title}`} /> : <div className="big-cover-fallback">📚</div>}
            <div>
              <strong>{item.title}</strong>
              <span>{item.author || 'Autor não informado'}</span>
              <small>{item.collection || 'Sem coleção'} • {item.genre || 'Sem gênero'}</small>
              <div className="book-meta"><b>{item.status || '—'}</b><b>{fmtNumber(item.currentPage)}/{fmtNumber(item.totalPages)} págs</b></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MigrationPanel({ user }) {
  const [fileName, setFileName] = useState('');
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('Aguardando o arquivo de migração. Use só se precisar reimportar a base.');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [importing, setImporting] = useState(false);

  const counts = payload?.counts;
  const totalOps = useMemo(() => {
    if (!payload) return 0;
    return (payload.books?.length || 0) + (payload.library?.length || 0) + (payload.sessions?.length || 0) + (payload.ratings?.length || 0) + (payload.goals?.length || 0) + (payload.collections?.length || 0);
  }, [payload]);

  async function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPayload(null);
    setProgress({ done: 0, total: 0 });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.format !== 'booklegacy-migration-v1') throw new Error('Arquivo inválido. O formato esperado é booklegacy-migration-v1.');
      if (parsed.expectedUid && parsed.expectedUid !== user.uid) throw new Error(`Este arquivo foi preparado para outro UID. Esperado: ${parsed.expectedUid}. Logado: ${user.uid}`);
      setPayload(parsed);
      setStatus('Arquivo lido com sucesso. Confira os números e clique em importar.');
    } catch (error) {
      setStatus(`Erro ao ler arquivo: ${error.message}`);
    }
  }

  async function startImport() {
    if (!payload || importing) return;
    setImporting(true);
    setStatus('Preparando importação...');
    setProgress({ done: 0, total: totalOps });
    const now = new Date().toISOString();
    const ops = [];
    for (const book of payload.books || []) {
      const { id, ...data } = book;
      ops.push({ ref: doc(db, 'books', id), data: cleanDoc({ ...data, importedAt: now, updatedAt: now }) });
    }
    for (const item of payload.library || []) {
      const { id, ...data } = item;
      ops.push({ ref: doc(db, 'users', user.uid, 'library', id), data: cleanDoc({ ...data, importedAt: now, updatedAt: now }) });
    }
    for (const session of payload.sessions || []) {
      const { id, ...data } = session;
      ops.push({ ref: doc(db, 'users', user.uid, 'sessions', id), data: cleanDoc({ ...data, importedAt: now }) });
    }
    for (const rating of payload.ratings || []) {
      const { id, ...data } = rating;
      ops.push({ ref: doc(db, 'users', user.uid, 'ratings', id), data: cleanDoc({ ...data, importedAt: now, updatedAt: now }) });
    }
    for (const goal of payload.goals || []) {
      const { id, ...data } = goal;
      ops.push({ ref: doc(db, 'users', user.uid, 'goals', id), data: cleanDoc({ ...data, importedAt: now, updatedAt: now }) });
    }
    for (const collectionItem of payload.collections || []) {
      const { id, ...data } = collectionItem;
      ops.push({ ref: doc(db, 'users', user.uid, 'collections', id), data: cleanDoc({ ...data, importedAt: now, updatedAt: now }) });
    }
    try {
      setStatus(`Importando ${ops.length} registros...`);
      await commitOperations(ops, (done, total) => { setProgress({ done, total }); setStatus(`Importando... ${done}/${total}`); });
      setStatus('Importação concluída com sucesso. Seus dados antigos já estão no Firestore.');
    } catch (error) {
      setStatus(`Erro durante importação: ${error.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="card migration-card">
      <div className="card-header">
        <span className="pill">Ferramenta</span>
        <h2>Migração da base antiga</h2>
        <p className="muted">Deixe esta tela guardada. Ela serve para reimportar a base se necessário.</p>
      </div>
      <label className="file-box"><input type="file" accept="application/json,.json" onChange={readFile} disabled={importing} /><span>{fileName || 'Escolher arquivo .json de migração'}</span></label>
      {counts && <div className="stats-grid small"><div><strong>{counts.books}</strong><span>livros</span></div><div><strong>{counts.library}</strong><span>biblioteca</span></div><div><strong>{counts.sessions}</strong><span>sessões</span></div><div><strong>{counts.ratings}</strong><span>notas</span></div><div><strong>{counts.collections}</strong><span>coleções</span></div><div><strong>{counts.goals}</strong><span>metas</span></div></div>}
      {progress.total > 0 && <div className="progress-wrap"><div className="progress-bar" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} /></div>}
      <p className="status-text">{status}</p>
      <button className="primary" onClick={startImport} disabled={!payload || importing}>{importing ? 'Importando...' : 'Importar para Firestore'}</button>
    </section>
  );
}

function AppShell({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const data = useReadingData(user);

  return (
    <main className="app-shell">
      <Topbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
      {data.error && <p className="error-text">Erro ao carregar Firestore: {data.error}</p>}
      {data.loading && activeTab !== 'migration' ? <LoadingCard /> : null}
      {!data.loading && activeTab === 'dashboard' && <DashboardView data={data} reload={data.reload} />}
      {!data.loading && activeTab === 'library' && <LibraryView data={data} />}
      {activeTab === 'migration' && <MigrationPanel user={user} />}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) await ensureUserProfile(firebaseUser);
        setUser(firebaseUser);
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  async function login() {
    setAuthError('');
    try { await signInWithPopup(auth, googleProvider); } catch (error) { setAuthError(error.message); }
  }

  if (loading) return <div className="center-screen"><div className="loader" />Carregando...</div>;
  if (!user) return <LoginScreen onLogin={login} error={authError} />;
  return <AppShell user={user} />;
}
