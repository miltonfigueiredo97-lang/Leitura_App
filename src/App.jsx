import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase.js';

const MAX_BATCH_OPS = 450;
const RATING_FIELDS = [
  ['dialogos', 'Diálogos'], ['enredo', 'Enredo'], ['estiloVisual', 'Estilo visual'], ['finalizacao', 'Finalização'], ['imersao', 'Imersão'],
  ['impactoEmocional', 'Impacto emocional'], ['originalidade', 'Originalidade'], ['personagens', 'Personagens'], ['ritmo', 'Ritmo'], ['temas', 'Temas']
];

function cleanDoc(obj) { const out = {}; for (const [k, v] of Object.entries(obj || {})) if (v !== undefined && v !== null) out[k] = v; return out; }
function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function txt(v) { return String(v || '').trim(); }
function statusKey(v) { return txt(v).toLowerCase(); }
function fmtNumber(v) { return new Intl.NumberFormat('pt-BR').format(Math.round(n(v))); }
function fmtDate(v) { if (!v) return '—'; const d = new Date(`${v}T12:00:00`); return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('pt-BR').format(d); }
function clampPct(v) { return Math.max(0, Math.min(100, Math.round(n(v)))); }
function slug(str) { return txt(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || `item-${Date.now()}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function currentYear() { return String(new Date().getFullYear()); }
function uniqueBy(arr, keyFn) { const seen = new Set(); return arr.filter((item) => { const k = keyFn(item); if (seen.has(k)) return false; seen.add(k); return true; }); }

function isCompleted(item) { return ['completo', 'lido', 'finalizado', 'concluido', 'concluído'].includes(statusKey(item.status)) || n(item.progress) >= 1; }
function isReading(item) { return ['lendo', 'em leitura'].includes(statusKey(item.status)); }
function isPaused(item) { return ['pausado', 'pausados'].includes(statusKey(item.status)); }
function isWaiting(item) { return ['aguardando', 'pendente', 'planejado'].includes(statusKey(item.status)); }
function itemYear(item) { return txt(item.targetYear || item.completionYear || item.year); }

async function ensureUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  const base = { name: user.displayName || '', email: user.email || '', photoURL: user.photoURL || '', role: 'user', plan: 'free', uid: user.uid, updatedAt: now };
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
  return <main className="login-screen"><section className="login-card"><div className="logo">📚</div><p className="eyebrow">BookLegacy</p><h1>Seu app global de leitura começa aqui.</h1><p className="muted">Entre com Google para acessar sua biblioteca segura no Firebase.</p><button className="primary" onClick={onLogin}>Entrar com Google</button>{error && <p className="error-text">{error}</p>}</section></main>;
}

function Topbar({ user, activeTab, setActiveTab }) {
  const tabs = [['dashboard', 'Dashboard'], ['library', 'Biblioteca'], ['reading', 'Registrar leitura'], ['add', 'Adicionar livro'], ['ratings', 'Avaliações'], ['migration', 'Migração']];
  return <header className="topbar"><div><p className="eyebrow">BookLegacy</p><h1>Dashboard de leitura</h1><p className="muted">Versão completa inicial: cadastro, leitura, edição, avaliação e dados reais.</p><nav className="tabs">{tabs.map(([id, label]) => <button key={id} className={activeTab === id ? 'on' : ''} onClick={() => setActiveTab(id)}>{label}</button>)}</nav></div><div className="profile">{user.photoURL && <img src={user.photoURL} alt="Foto" />}<div><strong>{user.displayName || 'Usuário'}</strong><span>{user.email}</span><code>{user.uid}</code></div><button className="ghost" onClick={() => signOut(auth)}>Sair</button></div></header>;
}

function Kpi({ icon, value, label, sub }) { return <article className="kpi"><span className="kpi-icon">{icon}</span><strong>{value}</strong><span>{label}</span>{sub && <small>{sub}</small>}</article>; }
function EmptyState({ title, text }) { return <section className="card empty-state"><h2>{title}</h2><p className="muted">{text}</p></section>; }
function LoadingCard() { return <div className="center-screen"><div className="loader" />Carregando dados do Firestore...</div>; }

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
      setState({ loading: false, error: '', books: mapSnap(booksSnap), library: mapSnap(librarySnap), sessions: mapSnap(sessionsSnap), ratings: mapSnap(ratingsSnap), goals: mapSnap(goalsSnap), collections: mapSnap(collectionsSnap) });
    } catch (error) { setState((old) => ({ ...old, loading: false, error: error.message })); }
  }
  useEffect(() => { load(); }, [user?.uid]);
  return { ...state, reload: load };
}

function getAvailableYears(data) {
  const years = new Set();
  data.goals.forEach((g) => n(g.year) && years.add(String(g.year)));
  data.library.forEach((i) => /^\d{4}$/.test(itemYear(i)) && years.add(itemYear(i)));
  data.sessions.forEach((s) => { const y = String(s.year || String(s.date || '').slice(0, 4)); if (/^\d{4}$/.test(y)) years.add(y); });
  return [...years].sort((a, b) => Number(b) - Number(a));
}
function filterByYear(data, yearFilter) {
  if (yearFilter === 'all') return data;
  const year = String(yearFilter);
  return { ...data, library: data.library.filter((i) => itemYear(i) === year), sessions: data.sessions.filter((s) => String(s.year || String(s.date || '').slice(0, 4)) === year), ratings: data.ratings.filter((r) => String(r.readingYear || '') === year) };
}
function buildStats(data, yearFilter) {
  const scoped = filterByYear(data, yearFilter);
  const active = scoped.library.filter((i) => !isPaused(i));
  const completed = scoped.library.filter(isCompleted).filter((i) => !isPaused(i));
  const reading = scoped.library.filter(isReading);
  const paused = scoped.library.filter(isPaused);
  const waiting = scoped.library.filter(isWaiting);
  const libraryPagesRead = active.reduce((acc, i) => acc + n(i.currentPage), 0);
  const libraryTotalPages = active.reduce((acc, i) => acc + n(i.totalPages || i.pages), 0);
  const sessionPages = scoped.sessions.reduce((acc, i) => acc + n(i.pages), 0);
  const minutes = scoped.sessions.reduce((acc, i) => acc + n(i.minutes), 0);
  const selectedYear = yearFilter === 'all' ? currentYear() : String(yearFilter);
  const goal = data.goals.find((g) => String(g.year) === selectedYear);
  const goalBooks = yearFilter === 'all' ? active.length : active.length || n(goal?.booksGoal || goal?.raw?.total);
  const goalPages = yearFilter === 'all' ? libraryTotalPages : libraryTotalPages || n(goal?.pagesGoal || goal?.raw?.paginasTotal);
  const avgRating = scoped.ratings.length ? scoped.ratings.reduce((acc, r) => acc + n(r.notaPonderada || r.notaFinal), 0) / scoped.ratings.length : 0;
  return { total: active.length, completed: completed.length, reading: reading.length, paused: paused.length, waiting: waiting.length, pagesRead: yearFilter === 'all' ? sessionPages : libraryPagesRead, libraryPagesRead, libraryTotalPages, sessionPages, minutes, sessions: scoped.sessions.length, ratings: scoped.ratings.length, collections: yearFilter === 'all' ? data.collections.length : new Set(active.map((i) => i.collection).filter(Boolean)).size, avgRating, goalYear: yearFilter === 'all' ? 'Todos os anos' : selectedYear, goalBooks, goalPages, booksGoalPct: goalBooks ? clampPct((completed.length / goalBooks) * 100) : 0, pagesGoalPct: goalPages ? clampPct((libraryPagesRead / goalPages) * 100) : 0 };
}

function DashboardView({ data, reload }) {
  const years = useMemo(() => getAvailableYears(data), [data]);
  const defaultYear = years.includes(currentYear()) ? currentYear() : (years[0] || 'all');
  const [yearFilter, setYearFilter] = useState(defaultYear);
  useEffect(() => { if (yearFilter !== 'all' && years.length && !years.includes(yearFilter)) setYearFilter(defaultYear); }, [years.join('|')]);
  const scoped = useMemo(() => filterByYear(data, yearFilter), [data, yearFilter]);
  const stats = useMemo(() => buildStats(data, yearFilter), [data, yearFilter]);
  const recentSessions = useMemo(() => [...scoped.sessions].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 8), [scoped.sessions]);
  const topRatings = useMemo(() => [...scoped.ratings].sort((a, b) => n(b.notaPonderada || b.notaFinal) - n(a.notaPonderada || a.notaFinal)).slice(0, 8), [scoped.ratings]);
  const readingNow = useMemo(() => scoped.library.filter(isReading).slice(0, 6), [scoped.library]);
  if (!data.library.length && !data.sessions.length) return <EmptyState title="Sua base ainda não apareceu" text="Confira se os documentos estão dentro do seu usuário no Firestore." />;
  return <>
    <section className="card filter-card"><div><span className="pill">Base estável</span><h2>Filtro principal</h2><p className="muted">Por padrão abre no ano atual/meta. Use “Todos os anos” para histórico.</p></div><select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>{years.map((y) => <option key={y} value={y}>{y}</option>)}<option value="all">Todos os anos</option></select></section>
    <section className="kpi-grid"><Kpi icon="📚" value={fmtNumber(stats.total)} label={yearFilter === 'all' ? 'Livros ativos' : `Livros da meta ${yearFilter}`} sub={`${fmtNumber(stats.completed)} concluídos`} /><Kpi icon="📖" value={fmtNumber(stats.reading)} label="Lendo agora" sub={`${fmtNumber(stats.waiting)} aguardando`} /><Kpi icon="📄" value={fmtNumber(stats.pagesRead)} label="Páginas lidas" sub={yearFilter === 'all' ? `${fmtNumber(stats.sessionPages)} por sessões` : `${fmtNumber(stats.libraryTotalPages)} páginas da meta`} /><Kpi icon="⏱️" value={fmtNumber(stats.sessions)} label="Sessões" sub={`${fmtNumber(stats.minutes)} minutos`} /><Kpi icon="⭐" value={stats.avgRating.toFixed(2)} label="Média das notas" sub={`${fmtNumber(stats.ratings)} avaliações`} /><Kpi icon="🧩" value={fmtNumber(stats.collections)} label="Coleções/Sagas" sub={yearFilter === 'all' ? 'Histórico' : `em ${yearFilter}`} /></section>
    <section className="grid2"><article className="card"><div className="card-title-row"><div><span className="pill">{yearFilter === 'all' ? 'Histórico' : `Meta ${yearFilter}`}</span><h2>Progresso anual</h2></div><button className="ghost" onClick={reload}>Atualizar</button></div><div className="goal-box"><div><strong>{stats.booksGoalPct}%</strong><span>{fmtNumber(stats.completed)} de {fmtNumber(stats.goalBooks)} livros</span><div className="progress-wrap"><div className="progress-bar" style={{ width: `${stats.booksGoalPct}%` }} /></div></div><div><strong>{stats.pagesGoalPct}%</strong><span>{fmtNumber(stats.libraryPagesRead)} de {fmtNumber(stats.goalPages)} páginas</span><div className="progress-wrap"><div className="progress-bar alt" style={{ width: `${stats.pagesGoalPct}%` }} /></div></div></div></article><article className="card"><span className="pill">Status</span><h2>Distribuição</h2><div className="status-list"><StatusLine label="Concluídos" value={stats.completed} total={stats.total} /><StatusLine label="Lendo" value={stats.reading} total={stats.total} /><StatusLine label="Aguardando" value={stats.waiting} total={stats.total} /><StatusLine label="Pausados" value={stats.paused} total={stats.total + stats.paused} /></div></article></section>
    <section className="grid3"><ListCard title="Lendo agora" badge="Atual" items={readingNow} empty="Nenhum livro lendo neste filtro.">{(i) => <BookRow item={i} right={`${clampPct(n(i.progress) * 100)}%`} />}</ListCard><ListCard title="Últimas sessões" badge="Histórico" items={recentSessions} empty="Nenhuma sessão.">{(i) => <SimpleRow title={i.title} sub={`${fmtDate(i.date)} • ${fmtNumber(i.pages)} págs • ${fmtNumber(i.minutes)} min`} right={i.collection} />}</ListCard><ListCard title="Top notas" badge="Ranking" items={topRatings} empty="Nenhuma nota.">{(i) => <SimpleRow title={i.title} sub={`Ano ${i.readingYear || '—'}`} right={Number(n(i.notaPonderada || i.notaFinal)).toFixed(2)} />}</ListCard></section>
  </>;
}

function StatusLine({ label, value, total }) { const pct = total ? clampPct((value / total) * 100) : 0; return <div className="status-line"><div><strong>{label}</strong><span>{fmtNumber(value)} livros</span></div><div className="progress-wrap"><div className="progress-bar" style={{ width: `${pct}%` }} /></div><b>{pct}%</b></div>; }
function ListCard({ title, badge, items, empty, children }) { return <article className="card list-card"><span className="pill">{badge}</span><h2>{title}</h2><div className="row-list">{items.length ? items.map((item) => <div key={item.id} className="list-row">{children(item)}</div>) : <p className="muted">{empty}</p>}</div></article>; }
function SimpleRow({ title, sub, right }) { return <><div className="row-main"><strong>{title || 'Sem título'}</strong><span>{sub}</span></div><em>{right || '—'}</em></>; }
function BookRow({ item, right }) { return <>{item.coverUrl ? <img className="mini-cover" src={item.coverUrl} alt="" /> : <div className="cover-fallback">📚</div>}<div className="row-main"><strong>{item.title || 'Sem título'}</strong><span>{item.author || item.collection || '—'}</span></div><em>{right}</em></>; }

function LibraryView({ data, user, reload }) {
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('todos'); const [editing, setEditing] = useState(null); const [msg, setMsg] = useState('');
  const filtered = useMemo(() => [...data.library].filter((i) => status === 'todos' || statusKey(i.status) === status).filter((i) => !query.trim() || `${i.title} ${i.author} ${i.collection} ${i.genre}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))), [data.library, query, status]);
  async function saveEdit(e) {
    e.preventDefault(); if (!editing) return;
    const form = new FormData(e.currentTarget); const totalPages = n(form.get('totalPages')); const currentPage = Math.min(n(form.get('currentPage')), totalPages || n(form.get('currentPage')));
    const statusVal = form.get('status'); const dataSave = { title: txt(form.get('title')), author: txt(form.get('author')), collection: txt(form.get('collection')), genre: txt(form.get('genre')), coverUrl: txt(form.get('coverUrl')), status: statusVal, targetYear: txt(form.get('targetYear')), totalPages, pages: totalPages, currentPage, progress: totalPages ? currentPage / totalPages : 0, updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, 'users', user.uid, 'library', editing.id), cleanDoc(dataSave));
    if (editing.bookId) await setDoc(doc(db, 'books', editing.bookId), cleanDoc({ title: dataSave.title, author: dataSave.author, collection: dataSave.collection, genre: dataSave.genre, pages: totalPages, coverUrl: dataSave.coverUrl, updatedAt: dataSave.updatedAt }), { merge: true });
    setMsg('Livro atualizado.'); setEditing(null); await reload();
  }
  return <section className="card"><div className="card-title-row"><div><span className="pill">Biblioteca</span><h2>Consulta e edição</h2><p className="muted">Busque, filtre e clique em Editar para corrigir status, páginas, capa, ano e dados do livro.</p></div><strong>{fmtNumber(filtered.length)} exibidos</strong></div>{msg && <p className="success-text">{msg}</p>}<div className="filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por livro, autor, coleção ou gênero" /><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="todos">Todos</option><option value="completo">Completo</option><option value="lendo">Lendo</option><option value="aguardando">Aguardando</option><option value="pausado">Pausado</option></select></div><div className="book-grid">{filtered.slice(0, 180).map((item) => <article className="book-card" key={item.id}>{item.coverUrl ? <img src={item.coverUrl} alt={`Capa de ${item.title}`} /> : <div className="big-cover-fallback">📚</div>}<div><strong>{item.title}</strong><span>{item.author || 'Autor não informado'}</span><small>{item.collection || 'Sem coleção'} • {item.genre || 'Sem gênero'}</small><div className="book-meta"><b>{item.status || '—'}</b><b>{fmtNumber(item.currentPage)}/{fmtNumber(item.totalPages)} págs</b><button className="mini-btn" onClick={() => setEditing(item)}>Editar</button></div></div></article>)}</div>{editing && <Modal title="Editar livro" onClose={() => setEditing(null)}><BookForm item={editing} onSubmit={saveEdit} submitLabel="Salvar alterações" /></Modal>}</section>;
}

function BookForm({ item = {}, onSubmit, submitLabel = 'Salvar' }) {
  return <form className="form-grid" onSubmit={onSubmit}><label>Título<input name="title" required defaultValue={item.title || ''} /></label><label>Autor<input name="author" defaultValue={item.author || ''} /></label><label>Coleção/Saga<input name="collection" defaultValue={item.collection || ''} /></label><label>Gênero<input name="genre" defaultValue={item.genre || ''} /></label><label>Total de páginas<input name="totalPages" type="number" min="0" defaultValue={item.totalPages || item.pages || ''} /></label><label>Página atual<input name="currentPage" type="number" min="0" defaultValue={item.currentPage || 0} /></label><label>Status<select name="status" defaultValue={item.status || 'aguardando'}><option value="aguardando">Aguardando</option><option value="lendo">Lendo</option><option value="completo">Completo</option><option value="pausado">Pausado</option></select></label><label>Ano/meta<input name="targetYear" defaultValue={item.targetYear || currentYear()} /></label><label className="wide">URL da capa<input name="coverUrl" defaultValue={item.coverUrl || ''} /></label><button className="primary wide" type="submit">{submitLabel}</button></form>;
}

function ReadingView({ data, user, reload }) {
  const [message, setMessage] = useState('');
  const candidates = useMemo(() => [...data.library].sort((a, b) => (isReading(b) - isReading(a)) || String(a.title || '').localeCompare(String(b.title || ''))), [data.library]);
  async function submit(e) {
    e.preventDefault(); setMessage('Salvando...');
    const form = new FormData(e.currentTarget); const itemId = form.get('itemId'); const item = data.library.find((i) => i.id === itemId); if (!item) return setMessage('Selecione um livro.');
    const pages = n(form.get('pages')); const minutes = n(form.get('minutes')); const seconds = n(form.get('seconds')); const date = txt(form.get('date')) || today();
    const totalPages = n(item.totalPages || item.pages); const currentPage = Math.min(totalPages || Infinity, n(item.currentPage) + pages); const newStatus = totalPages && currentPage >= totalPages ? 'completo' : 'lendo';
    await addDoc(collection(db, 'users', user.uid, 'sessions'), cleanDoc({ bookId: item.bookId || item.id, libraryItemId: item.id, title: item.title, livro: item.title, collection: item.collection, date, pages, minutes, seconds, year: Number(date.slice(0, 4)), createdAt: new Date().toISOString() }));
    await updateDoc(doc(db, 'users', user.uid, 'library', item.id), cleanDoc({ currentPage, status: newStatus, progress: totalPages ? currentPage / totalPages : 0, updatedAt: new Date().toISOString(), lastReadAt: date }));
    e.currentTarget.reset(); setMessage(`Leitura registrada: +${pages} páginas em ${item.title}.`); await reload();
  }
  return <section className="card"><span className="pill">Uso diário</span><h2>Registrar leitura</h2><p className="muted">Salva uma sessão e atualiza a página atual do livro. Se chegar ao final, marca como completo.</p>{message && <p className="success-text">{message}</p>}<form className="form-grid" onSubmit={submit}><label className="wide">Livro<select name="itemId" required defaultValue=""><option value="" disabled>Selecione um livro</option>{candidates.map((i) => <option key={i.id} value={i.id}>{isReading(i) ? '📖 ' : ''}{i.title} — {i.currentPage || 0}/{i.totalPages || i.pages || 0} págs</option>)}</select></label><label>Data<input name="date" type="date" defaultValue={today()} /></label><label>Páginas lidas<input name="pages" type="number" min="1" required /></label><label>Minutos<input name="minutes" type="number" min="0" required /></label><label>Segundos<input name="seconds" type="number" min="0" defaultValue="0" /></label><button className="primary wide" type="submit">Salvar leitura</button></form></section>;
}

async function searchBookApis(q) {
  const query = encodeURIComponent(q);
  const [gb, ol] = await Promise.allSettled([
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=8`).then((r) => r.json()),
    fetch(`https://openlibrary.org/search.json?q=${query}&limit=8`).then((r) => r.json()),
  ]);
  const google = gb.status === 'fulfilled' ? (gb.value.items || []).map((it) => ({ source: 'google_books', apiId: it.id, title: it.volumeInfo?.title || '', author: (it.volumeInfo?.authors || []).join(', '), collection: '', genre: (it.volumeInfo?.categories || [])[0] || '', pages: it.volumeInfo?.pageCount || 0, isbn: (it.volumeInfo?.industryIdentifiers || [])[0]?.identifier || '', coverUrl: it.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || '' })) : [];
  const open = ol.status === 'fulfilled' ? (ol.value.docs || []).map((it) => ({ source: 'open_library', apiId: it.key, title: it.title || '', author: (it.author_name || []).slice(0, 3).join(', '), collection: '', genre: (it.subject || [])[0] || '', pages: it.number_of_pages_median || 0, isbn: (it.isbn || [])[0] || '', coverUrl: it.cover_i ? `https://covers.openlibrary.org/b/id/${it.cover_i}-L.jpg` : '' })) : [];
  return uniqueBy([...google, ...open].filter((x) => x.title), (x) => `${x.title}|${x.author}`.toLowerCase()).slice(0, 12);
}

function AddBookView({ user, reload }) {
  const [query, setQuery] = useState(''); const [results, setResults] = useState([]); const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(false); const [manual, setManual] = useState(false);
  async function doSearch(e) { e.preventDefault(); setLoading(true); setMsg('Buscando em Google Books e Open Library...'); try { const r = await searchBookApis(query); setResults(r); setMsg(r.length ? `${r.length} opções encontradas.` : 'Nenhuma opção encontrada. Use cadastro manual.'); } catch (err) { setMsg(`Erro na busca: ${err.message}`); } finally { setLoading(false); } }
  async function addToLibrary(book, extra = {}) {
    const now = new Date().toISOString(); const bookId = book.isbn ? `isbn_${slug(book.isbn)}` : `${book.source || 'manual'}_${slug(book.title)}_${slug(book.author)}`;
    const pages = n(book.pages || extra.totalPages);
    await setDoc(doc(db, 'books', bookId), cleanDoc({ title: book.title, normalizedTitle: slug(book.title), author: book.author, normalizedAuthor: slug(book.author), collection: book.collection || extra.collection || '', genre: book.genre || extra.genre || '', pages, coverUrl: book.coverUrl || extra.coverUrl || '', isbn: book.isbn || '', source: book.source || 'manual', apiSource: book.source || 'manual', createdBy: user.uid, createdAt: now, updatedAt: now }), { merge: true });
    const libraryId = `${bookId}_${extra.targetYear || currentYear()}`;
    await setDoc(doc(db, 'users', user.uid, 'library', libraryId), cleanDoc({ bookId, title: book.title, author: book.author, collection: book.collection || extra.collection || '', genre: book.genre || extra.genre || '', coverUrl: book.coverUrl || extra.coverUrl || '', isbn: book.isbn || '', totalPages: pages, pages, currentPage: n(extra.currentPage), status: extra.status || 'aguardando', targetYear: extra.targetYear || currentYear(), progress: pages ? n(extra.currentPage) / pages : 0, createdAt: now, updatedAt: now }), { merge: true });
    setMsg(`Livro adicionado: ${book.title}`); await reload();
  }
  async function manualSubmit(e) { e.preventDefault(); const f = new FormData(e.currentTarget); await addToLibrary({ source: 'manual', title: txt(f.get('title')), author: txt(f.get('author')), collection: txt(f.get('collection')), genre: txt(f.get('genre')), pages: n(f.get('totalPages')), coverUrl: txt(f.get('coverUrl')), isbn: txt(f.get('isbn')) }, { status: f.get('status'), targetYear: txt(f.get('targetYear')), currentPage: n(f.get('currentPage')) }); e.currentTarget.reset(); }
  return <section className="card"><div className="card-title-row"><div><span className="pill">Cadastro</span><h2>Adicionar livro</h2><p className="muted">Busque por API ou cadastre manualmente. Tudo fica editável depois.</p></div><button className="ghost" onClick={() => setManual(!manual)}>{manual ? 'Ocultar manual' : 'Cadastro manual'}</button></div>{msg && <p className="status-text">{msg}</p>}<form className="filters" onSubmit={doSearch}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por título, autor ou ISBN" required /><button className="primary" disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button></form>{manual && <div className="sub-card"><h3>Cadastro manual</h3><BookForm onSubmit={manualSubmit} submitLabel="Adicionar manualmente" /></div>}<div className="book-grid search-results">{results.map((book) => <article className="book-card" key={`${book.source}-${book.apiId}-${book.title}`}>{book.coverUrl ? <img src={book.coverUrl} alt="" /> : <div className="big-cover-fallback">📚</div>}<div><strong>{book.title}</strong><span>{book.author || 'Autor não informado'}</span><small>{book.genre || book.source} • {fmtNumber(book.pages)} págs</small><div className="book-meta"><button className="mini-btn" onClick={() => addToLibrary(book)}>Adicionar</button></div></div></article>)}</div></section>;
}

function RatingsView({ data, user, reload }) {
  const [msg, setMsg] = useState(''); const [selected, setSelected] = useState('');
  const item = data.library.find((i) => i.id === selected) || data.library[0];
  async function submit(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const libraryItem = data.library.find((i) => i.id === f.get('itemId')); if (!libraryItem) return; const scores = {}; RATING_FIELDS.forEach(([k]) => scores[k] = n(f.get(k))); const notaFinal = RATING_FIELDS.reduce((a, [k]) => a + scores[k], 0) / RATING_FIELDS.length; const pages = n(libraryItem.totalPages || libraryItem.pages); const fatorTamanho = pages >= 1000 ? 1.06 : pages < 100 ? 0.94 : 1; const notaPonderada = Math.max(0, Math.min(10, notaFinal * fatorTamanho)); const now = new Date().toISOString(); const id = `${libraryItem.bookId || libraryItem.id}_${f.get('readingYear') || currentYear()}`;
    await setDoc(doc(db, 'users', user.uid, 'ratings', id), cleanDoc({ bookId: libraryItem.bookId || libraryItem.id, libraryItemId: libraryItem.id, title: libraryItem.title, readingYear: txt(f.get('readingYear')) || currentYear(), ...scores, notaFinal: Number(notaFinal.toFixed(2)), fatorTamanho, notaPonderada: Number(notaPonderada.toFixed(2)), createdAt: now, updatedAt: now }), { merge: true }); setMsg(`Avaliação salva: ${libraryItem.title} — ${notaPonderada.toFixed(2)}`); await reload(); }
  const latest = useMemo(() => [...data.ratings].sort((a, b) => n(b.notaPonderada || b.notaFinal) - n(a.notaPonderada || a.notaFinal)).slice(0, 20), [data.ratings]);
  return <section className="grid2"><article className="card"><span className="pill">Notas</span><h2>Avaliar livro</h2><p className="muted">Salva as 10 categorias e calcula a nota final com fator de tamanho simples.</p>{msg && <p className="success-text">{msg}</p>}<form className="form-grid" onSubmit={submit}><label className="wide">Livro<select name="itemId" value={selected || item?.id || ''} onChange={(e) => setSelected(e.target.value)} required>{data.library.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}</select></label><label>Ano da leitura<input name="readingYear" defaultValue={currentYear()} /></label>{RATING_FIELDS.map(([k, label]) => <label key={k}>{label}<input name={k} type="number" min="0" max="10" step="0.1" defaultValue="8" /></label>)}<button className="primary wide" type="submit">Salvar avaliação</button></form></article><ListCard title="Ranking de avaliações" badge="Top" items={latest} empty="Nenhuma avaliação.">{(i) => <SimpleRow title={i.title} sub={`Ano ${i.readingYear || '—'} • média ${n(i.notaFinal).toFixed(2)}`} right={Number(n(i.notaPonderada || i.notaFinal)).toFixed(2)} />}</ListCard></section>;
}

function Modal({ title, children, onClose }) { return <div className="modal-backdrop"><div className="modal-card"><div className="card-title-row"><h2>{title}</h2><button className="ghost" onClick={onClose}>Fechar</button></div>{children}</div></div>; }

function MigrationPanel({ user }) {
  const [fileName, setFileName] = useState(''); const [payload, setPayload] = useState(null); const [status, setStatus] = useState('Ferramenta guardada. Use só se precisar reimportar a base.'); const [progress, setProgress] = useState({ done: 0, total: 0 }); const [importing, setImporting] = useState(false);
  const counts = payload?.counts; const totalOps = useMemo(() => payload ? ['books', 'library', 'sessions', 'ratings', 'goals', 'collections'].reduce((a, k) => a + (payload[k]?.length || 0), 0) : 0, [payload]);
  async function readFile(event) { const file = event.target.files?.[0]; if (!file) return; setFileName(file.name); try { const parsed = JSON.parse(await file.text()); if (parsed.format !== 'booklegacy-migration-v1') throw new Error('Arquivo inválido.'); if (parsed.expectedUid && parsed.expectedUid !== user.uid) throw new Error(`Arquivo de outro UID. Esperado: ${parsed.expectedUid}`); setPayload(parsed); setStatus('Arquivo lido. Confira e importe somente se necessário.'); } catch (e) { setStatus(`Erro: ${e.message}`); } }
  async function startImport() { if (!payload || importing) return; setImporting(true); const now = new Date().toISOString(); const ops = []; for (const book of payload.books || []) { const { id, ...data } = book; ops.push({ ref: doc(db, 'books', id), data: cleanDoc({ ...data, importedAt: now, updatedAt: now }) }); } for (const key of ['library', 'sessions', 'ratings', 'goals', 'collections']) for (const item of payload[key] || []) { const { id, ...data } = item; ops.push({ ref: doc(db, 'users', user.uid, key, id), data: cleanDoc({ ...data, importedAt: now, updatedAt: now }) }); } try { await commitOperations(ops, (done, total) => { setProgress({ done, total }); setStatus(`Importando... ${done}/${total}`); }); setStatus('Importação concluída.'); } catch (e) { setStatus(`Erro: ${e.message}`); } finally { setImporting(false); } }
  return <section className="card migration-card"><span className="pill">Ferramenta</span><h2>Migração da base antiga</h2><p className="muted">Não use novamente se a base já está correta, para evitar sobrescrever dados.</p><label className="file-box"><input type="file" accept="application/json,.json" onChange={readFile} disabled={importing} /><span>{fileName || 'Escolher arquivo .json de migração'}</span></label>{counts && <div className="stats-grid small"><div><strong>{counts.books}</strong><span>livros</span></div><div><strong>{counts.library}</strong><span>biblioteca</span></div><div><strong>{counts.sessions}</strong><span>sessões</span></div><div><strong>{counts.ratings}</strong><span>notas</span></div><div><strong>{counts.collections}</strong><span>coleções</span></div><div><strong>{counts.goals}</strong><span>metas</span></div></div>}{progress.total > 0 && <div className="progress-wrap"><div className="progress-bar" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} /></div>}<p className="status-text">{status}</p><button className="primary" onClick={startImport} disabled={!payload || importing}>{importing ? 'Importando...' : 'Importar para Firestore'}</button></section>;
}

function AppShell({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard'); const data = useReadingData(user);
  return <main className="app-shell"><Topbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />{data.error && <p className="error-text">Erro ao carregar Firestore: {data.error}</p>}{data.loading && activeTab !== 'migration' ? <LoadingCard /> : null}{!data.loading && activeTab === 'dashboard' && <DashboardView data={data} reload={data.reload} />}{!data.loading && activeTab === 'library' && <LibraryView data={data} user={user} reload={data.reload} />}{!data.loading && activeTab === 'reading' && <ReadingView data={data} user={user} reload={data.reload} />}{!data.loading && activeTab === 'add' && <AddBookView user={user} reload={data.reload} />}{!data.loading && activeTab === 'ratings' && <RatingsView data={data} user={user} reload={data.reload} />}{activeTab === 'migration' && <MigrationPanel user={user} />}</main>;
}

export default function App() {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); const [authError, setAuthError] = useState('');
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => { try { if (firebaseUser) await ensureUserProfile(firebaseUser); setUser(firebaseUser); } catch (e) { setAuthError(e.message); } finally { setLoading(false); } }); return unsubscribe; }, []);
  async function login() { setAuthError(''); try { await signInWithPopup(auth, googleProvider); } catch (e) { setAuthError(e.message); } }
  if (loading) return <div className="center-screen"><div className="loader" />Carregando...</div>;
  if (!user) return <LoginScreen onLogin={login} error={authError} />;
  return <AppShell user={user} />;
}
