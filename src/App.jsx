import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
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

function MigrationPanel({ user }) {
  const [fileName, setFileName] = useState('');
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('Aguardando o arquivo de migração.');
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
      if (parsed.format !== 'booklegacy-migration-v1') {
        throw new Error('Arquivo inválido. O formato esperado é booklegacy-migration-v1.');
      }
      if (parsed.expectedUid && parsed.expectedUid !== user.uid) {
        throw new Error(`Este arquivo foi preparado para outro UID. Esperado: ${parsed.expectedUid}. Logado: ${user.uid}`);
      }
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
      ops.push({
        ref: doc(db, 'books', id),
        data: cleanDoc({ ...data, importedAt: now, updatedAt: now }),
      });
    }

    for (const item of payload.library || []) {
      const { id, ...data } = item;
      ops.push({
        ref: doc(db, 'users', user.uid, 'library', id),
        data: cleanDoc({ ...data, importedAt: now, updatedAt: now }),
      });
    }

    for (const session of payload.sessions || []) {
      const { id, ...data } = session;
      ops.push({
        ref: doc(db, 'users', user.uid, 'sessions', id),
        data: cleanDoc({ ...data, importedAt: now }),
      });
    }

    for (const rating of payload.ratings || []) {
      const { id, ...data } = rating;
      ops.push({
        ref: doc(db, 'users', user.uid, 'ratings', id),
        data: cleanDoc({ ...data, importedAt: now, updatedAt: now }),
      });
    }

    for (const goal of payload.goals || []) {
      const { id, ...data } = goal;
      ops.push({
        ref: doc(db, 'users', user.uid, 'goals', id),
        data: cleanDoc({ ...data, importedAt: now, updatedAt: now }),
      });
    }

    for (const collectionItem of payload.collections || []) {
      const { id, ...data } = collectionItem;
      ops.push({
        ref: doc(db, 'users', user.uid, 'collections', id),
        data: cleanDoc({ ...data, importedAt: now, updatedAt: now }),
      });
    }

    try {
      setStatus(`Importando ${ops.length} registros...`);
      await commitOperations(ops, (done, total) => {
        setProgress({ done, total });
        setStatus(`Importando... ${done}/${total}`);
      });
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
        <span className="pill">Passo de migração</span>
        <h2>Migrar base antiga</h2>
        <p>Selecione o arquivo de migração que eu gerei para levar seus livros, sessões e notas para o Firestore.</p>
      </div>

      <label className="file-box">
        <input type="file" accept="application/json,.json" onChange={readFile} disabled={importing} />
        <span>{fileName || 'Escolher arquivo .json de migração'}</span>
      </label>

      {counts && (
        <div className="stats-grid small">
          <div><strong>{counts.books}</strong><span>livros globais</span></div>
          <div><strong>{counts.library}</strong><span>itens biblioteca</span></div>
          <div><strong>{counts.sessions}</strong><span>sessões</span></div>
          <div><strong>{counts.ratings}</strong><span>notas</span></div>
          <div><strong>{counts.collections}</strong><span>coleções</span></div>
          <div><strong>{counts.goals}</strong><span>metas</span></div>
        </div>
      )}

      {progress.total > 0 && (
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
        </div>
      )}

      <p className="status-text">{status}</p>

      <button className="primary" onClick={startImport} disabled={!payload || importing}>
        {importing ? 'Importando...' : 'Importar para Firestore'}
      </button>
    </section>
  );
}

function Dashboard({ user }) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BookLegacy</p>
          <h1>Controle global de leitura</h1>
          <p className="muted">Primeira base do app: login, segurança, Firestore e migração.</p>
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

      <section className="stats-grid">
        <div><strong>Auth</strong><span>Google ativo</span></div>
        <div><strong>Firestore</strong><span>Conectado</span></div>
        <div><strong>Plano</strong><span>Free preparado</span></div>
      </section>

      <MigrationPanel user={user} />
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
        if (firebaseUser) {
          await ensureUserProfile(firebaseUser);
        }
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(error.message);
    }
  }

  if (loading) {
    return <div className="center-screen"><div className="loader" />Carregando...</div>;
  }

  if (!user) {
    return (
      <main className="login-screen">
        <section className="login-card">
          <div className="logo">📚</div>
          <p className="eyebrow">BookLegacy</p>
          <h1>Seu app global de leitura começa aqui.</h1>
          <p className="muted">Entre com Google para criar seu usuário seguro no Firebase.</p>
          <button className="primary" onClick={login}>Entrar com Google</button>
          {authError && <p className="error-text">{authError}</p>}
        </section>
      </main>
    );
  }

  return <Dashboard user={user} />;
}
