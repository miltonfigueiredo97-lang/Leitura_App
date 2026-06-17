import { useEffect, useMemo, useState } from "react";
import { BookOpen, LogIn, LogOut, ShieldCheck, Sparkles, User } from "lucide-react";
import { auth, db, googleProvider } from "./firebase";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

function normalizeUser(firebaseUser) {
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || "Leitor",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || "",
    role: "user",
    plan: "free"
  };
}

async function ensureUserDocument(firebaseUser) {
  const user = normalizeUser(firebaseUser);
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await setDoc(ref, {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  return user;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError("");
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }
        const appUser = await ensureUserDocument(firebaseUser);
        setUser(appUser);
      } catch (err) {
        console.error(err);
        setError("Não foi possível preparar seu usuário no banco.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      if (err?.code === "auth/unauthorized-domain") {
        setError("Domínio não autorizado no Firebase Authentication. Depois vamos autorizar o domínio da Vercel.");
      } else if (err?.code !== "auth/popup-closed-by-user") {
        setError("Erro ao entrar com Google. Confira se o provedor Google está ativado no Firebase.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  const greeting = useMemo(() => {
    if (!user?.name) return "Leitor";
    return user.name.split(" ")[0];
  }, [user]);

  if (loading) {
    return <main className="center"><div className="loader">Carregando BookLegacy...</div></main>;
  }

  if (!user) {
    return (
      <main className="login-page">
        <section className="hero-card">
          <div className="brand"><BookOpen size={42} /><span>BookLegacy</span></div>
          <h1>Seu controle de leitura evoluindo para app.</h1>
          <p>Login Google, biblioteca privada, metas, notas e estatísticas. Esta é a primeira base segura do projeto.</p>
          <button className="primary" onClick={handleLogin}><LogIn size={18} /> Entrar com Google</button>
          {error && <p className="error">{error}</p>}
          <div className="features">
            <div><ShieldCheck size={20} /> Dados protegidos por usuário</div>
            <div><Sparkles size={20} /> Pronto para virar produto</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand small"><BookOpen size={28} /><span>BookLegacy</span></div>
        <button className="ghost" onClick={handleLogout}><LogOut size={16} /> Sair</button>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">App conectado ao Firebase</p>
          <h1>Bem-vindo, {greeting}.</h1>
          <p>Login funcionando. O documento do usuário já foi criado/atualizado no Firestore em <b>users/{user.uid}</b>.</p>
        </div>
        <div className="profile-card">
          {user.photoURL ? <img src={user.photoURL} alt="Foto do usuário" /> : <User size={38} />}
          <strong>{user.name}</strong>
          <span>{user.email}</span>
          <em>Plano: {user.plan}</em>
        </div>
      </section>

      <section className="grid">
        <div className="card"><h2>Biblioteca</h2><p>Próximo módulo: importar seus livros da planilha e criar a coleção pessoal.</p></div>
        <div className="card"><h2>Sessões</h2><p>Próximo módulo: registrar páginas, minutos e histórico por dia.</p></div>
        <div className="card"><h2>Notas</h2><p>Próximo módulo: recriar suas 10 categorias de avaliação e nota ponderada.</p></div>
      </section>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
