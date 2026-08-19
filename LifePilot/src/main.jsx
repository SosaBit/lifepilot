 import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Flame,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Settings,
  Sparkles,
  Target,
  Trophy,
  User,
  X,
} from "lucide-react";
import { supabase, supabaseEnabled } from "./lib/supabase";
import "./styles.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!supabaseEnabled || !supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    }

    loadSession();

    if (!supabaseEnabled || !supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!supabaseEnabled) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand large">
            <span className="brand-mark">
              <Sparkles size={18} />
            </span>
            <span>LifePilot</span>
          </div>

          <h1>Configurazione incompleta</h1>

          <p>
            LifePilot non riesce a collegarsi a Supabase.
            Controlla le variabili Vercel.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <Dashboard session={session} />;
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <Sparkles size={22} />
      </div>
      <strong>LifePilot</strong>
      <span>Caricamento...</span>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleEmailAuth(e) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          throw new Error("Inserisci il tuo nome.");
        }

        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: name.trim(),
              },
            },
          });

        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage(
            "Account creato. Controlla la tua email per confermare l'account."
          );
        }
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(getAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error: googleError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "https://lifepilot-26vdyare5-brandecho2k25-8479s-projects.vercel.app"
          },
        });

      if (googleError) throw googleError;
    } catch (err) {
      setError(
        err?.message ||
          "Impossibile avviare l'accesso con Google."
      );

      setBusy(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <button className="brand" type="button">
          <span className="brand-mark">
            <Sparkles size={17} />
          </span>
          <span>LifePilot</span>
        </button>

        <div className="auth-topbar-right">
          {mode === "login" ? (
            <>
              <span>Non hai un account?</span>
              <button
                type="button"
                onClick={() => switchMode("signup")}
              >
                Registrati
              </button>
            </>
          ) : (
            <>
              <span>Hai già un account?</span>
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Accedi
              </button>
            </>
          )}
        </div>
      </div>

      <main className="auth-layout">
        <section className="auth-intro">
          <div className="auth-intro-content">
            <div className="auth-eyebrow">
              IL TUO SPAZIO PERSONALE
            </div>

            <h1>
              La tua vita.
              <br />
              <span>Un passo alla volta.</span>
            </h1>

            <p>
              LifePilot ti aiuta a trasformare ciò che vuoi
              ottenere in obiettivi concreti, abitudini e
              progressi misurabili.
            </p>

            <div className="auth-benefits">
              <div>
                <span className="benefit-icon">
                  <Target size={17} />
                </span>

                <div>
                  <strong>Obiettivi chiari</strong>
                  <small>
                    Dai una direzione a ciò che vuoi
                    raggiungere.
                  </small>
                </div>
              </div>

              <div>
                <span className="benefit-icon">
                  <Flame size={17} />
                </span>

                <div>
                  <strong>Costanza quotidiana</strong>
                  <small>
                    Costruisci il tuo percorso giorno dopo
                    giorno.
                  </small>
                </div>
              </div>

              <div>
                <span className="benefit-icon">
                  <BarChart3 size={17} />
                </span>

                <div>
                  <strong>Progressi reali</strong>
                  <small>
                    Tieni sotto controllo quanto stai
                    avanzando.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-area">
          <div className="auth-card">
            <div className="auth-card-heading">
              <div className="auth-card-icon">
                {mode === "login" ? (
                  <Sparkles size={20} />
                ) : (
                  <Target size={20} />
                )}
              </div>

              <div>
                <span className="eyebrow">
                  {mode === "login"
                    ? "BENTORNATO"
                    : "INIZIAMO"}
                </span>

                <h2>
                  {mode === "login"
                    ? "Accedi a LifePilot"
                    : "Crea il tuo account"}
                </h2>
              </div>
            </div>

            <p className="auth-card-description">
              {mode === "login"
                ? "Riprendi il tuo percorso esattamente da dove lo avevi lasciato."
                : "Crea il tuo spazio personale e inizia a costruire il tuo percorso."}
            </p>

            <button
              className="google-btn"
              onClick={handleGoogle}
              disabled={busy}
              type="button"
            >
              <GoogleIcon />
              <span>
                {busy
                  ? "Attendi..."
                  : "Continua con Google"}
              </span>
            </button>

            <div className="auth-divider">
              <span>oppure continua con email</span>
            </div>

            <form
              onSubmit={handleEmailAuth}
              className="auth-form"
            >
              {mode === "signup" && (
                <label>
                  Nome
                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Come vuoi essere chiamato?"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="nome@email.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Almeno 6 caratteri"
                  minLength={6}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                />
              </label>

              {mode === "login" && (
                <div className="auth-extra-row">
                  <span>Accesso sicuro con Supabase</span>
                </div>
              )}

              {error && (
                <div className="auth-message error">
                  {error}
                </div>
              )}

              {message && (
                <div className="auth-message success">
                  {message}
                </div>
              )}

              <button
                className="primary-btn auth-submit"
                disabled={busy}
                type="submit"
              >
                {busy
                  ? "Attendi..."
                  : mode === "login"
                  ? "Accedi a LifePilot"
                  : "Crea account"}

                {!busy && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="auth-mobile-switch">
              {mode === "login" ? (
                <>
                  <span>
                    Non hai ancora un account?
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      switchMode("signup")
                    }
                  >
                    Registrati
                  </button>
                </>
              ) : (
                <>
                  <span>Hai già un account?</span>

                  <button
                    type="button"
                    onClick={() =>
                      switchMode("login")
                    }
                  >
                    Accedi
                  </button>
                </>
              )}
            </div>

            <div className="auth-security">
              <Check size={14} />
              <span>
                I tuoi dati personali rimangono nel tuo
                account.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Dashboard({ session }) {
  const [view, setView] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const user = session.user;

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "utente";

  const activeGoal = useMemo(
    () => goals[0] || null,
    [goals]
  );

  useEffect(() => {
    loadGoals();
  }, [user.id]);

  async function loadGoals() {
    setLoadingGoals(true);

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setGoals(data || []);
    }

    setLoadingGoals(false);
  }

  async function createGoal(goal) {
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: goal.title,
        category: goal.category,
        duration_days: Number(goal.duration_days),
        progress: 0,
        streak: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setGoals((current) => [data, ...current]);
      setCreateOpen(false);
    } else {
      alert(
        error?.message ||
          "Non è stato possibile creare l'obiettivo."
      );
    }
  }

  async function deleteGoal(id) {
    const confirmed = window.confirm(
      "Vuoi eliminare definitivamente questo obiettivo?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setGoals((current) =>
        current.filter((goal) => goal.id !== id)
      );
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setView("home");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          <button
            className="brand"
            onClick={() => setView("home")}
          >
            <span className="brand-mark">
              <Sparkles size={17} />
            </span>

            <span>LifePilot</span>
          </button>

          <div className="topbar-actions">
            <div className="user-mini">
              {getInitial(userName)}
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <div className="brand">
                <span className="brand-mark">
                  <Sparkles size={17} />
                </span>
                <span>LifePilot</span>
              </div>

              <button
                className="icon-btn"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <Nav
              view={view}
              setView={(next) => {
                setView(next);
                setMobileOpen(false);
              }}
            />
          </aside>
        </div>
      )}

      <div className="page-shell">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="eyebrow">IL MIO SPAZIO</div>

            <Nav
              view={view}
              setView={setView}
            />
          </div>

          <div className="account-card">
            <div className="account-avatar">
              {getInitial(userName)}
            </div>

            <strong>{userName}</strong>

            <span>{user.email}</span>

            <button
              className="logout-btn"
              onClick={logout}
            >
              <LogOut size={16} />
              Esci
            </button>
          </div>
        </aside>

        <main className="main-content">
          {view === "home" && (
            <Home
              name={userName}
              goal={activeGoal}
              goals={goals}
              loading={loadingGoals}
              onCreate={() => setCreateOpen(true)}
              onDelete={deleteGoal}
            />
          )}

          {view === "goals" && (
            <Goals
              goals={goals}
              loading={loadingGoals}
              onCreate={() => setCreateOpen(true)}
              onDelete={deleteGoal}
            />
          )}

          {view === "progress" && (
            <Progress goals={goals} />
          )}

          {view === "coach" && (
            <Coach />
          )}

          {view === "profile" && (
            <Profile
              user={user}
              name={userName}
              onLogout={logout}
            />
          )}
        </main>
      </div>

      <nav className="bottom-nav">
        <BottomNavItem
          icon={<Target size={20} />}
          label="Oggi"
          active={view === "home"}
          onClick={() => setView("home")}
        />

        <BottomNavItem
          icon={<BarChart3 size={20} />}
          label="Progressi"
          active={view === "progress"}
          onClick={() => setView("progress")}
        />

        <button
          className="fab"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={25} />
        </button>

        <BottomNavItem
          icon={<MessageCircle size={20} />}
          label="Coach"
          active={view === "coach"}
          onClick={() => setView("coach")}
        />

        <BottomNavItem
          icon={<Settings size={20} />}
          label="Profilo"
          active={view === "profile"}
          onClick={() => setView("profile")}
        />
      </nav>

      {createOpen && (
        <CreateGoalModal
          onClose={() => setCreateOpen(false)}
          onCreate={createGoal}
        />
      )}
    </div>
  );
}

function Nav({ view, setView }) {
  return (
    <nav className="nav-list">
      <button
        className={
          view === "home"
            ? "nav-item active"
            : "nav-item"
        }
        onClick={() => setView("home")}
      >
        <Target size={18} />
        Oggi
      </button>

      <button
        className={
          view === "goals"
            ? "nav-item active"
            : "nav-item"
        }
        onClick={() => setView("goals")}
      >
        <Trophy size={18} />
        I miei obiettivi
      </button>

      <button
        className={
          view === "coach"
            ? "nav-item active"
            : "nav-item"
        }
        onClick={() => setView("coach")}
      >
        <MessageCircle size={18} />
        Coach AI
      </button>

      <button
        className={
          view === "progress"
            ? "nav-item active"
            : "nav-item"
        }
        onClick={() => setView("progress")}
      >
        <BarChart3 size={18} />
        Progressi
      </button>

      <button
        className={
          view === "profile"
            ? "nav-item active"
            : "nav-item"
        }
        onClick={() => setView("profile")}
      >
        <Settings size={18} />
        Profilo
      </button>
    </nav>
  );
}

function Home({
  name,
  goal,
  goals,
  loading,
  onCreate,
  onDelete,
}) {
  return (
    <div className="stack">
      <section className="hero-row">
        <div>
          <div className="eyebrow">
            IL TUO OBIETTIVO
          </div>

          <h1>
            Buongiorno, {capitalize(name)}.
          </h1>

          <p>
            Piccoli passi oggi. Grandi risultati nel tempo.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={onCreate}
        >
          <Plus size={18} />
          Nuovo obiettivo
        </button>
      </section>

      {loading ? (
        <div className="panel loading-panel">
          Caricamento dei tuoi obiettivi...
        </div>
      ) : !goal ? (
        <EmptyGoals onCreate={onCreate} />
      ) : (
        <>
          <section className="streak-strip">
            <div className="streak-main">
              <span className="fire">
                <Flame size={19} />
              </span>

              <div>
                <strong>
                  {goal.streak || 0} giorni
                </strong>

                <span>di fila</span>
              </div>
            </div>

            <div className="streak-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    (goal.streak || 0) * 10
                  )}%`,
                }}
              />
            </div>

            <span className="streak-copy">
              Continua così
            </span>
          </section>

          <section className="today-card">
            <div className="today-head">
              <div>
                <div className="eyebrow">
                  OBIETTIVO ATTIVO
                </div>

                <h2>{goal.title}</h2>

                <p>
                  {goal.category} ·{" "}
                  {goal.duration_days} giorni
                </p>
              </div>

              <div className="today-ring">
                <span>
                  {goal.progress || 0}%
                </span>

                <small>completato</small>
              </div>
            </div>

            <div className="goal-bar">
              <span
                style={{
                  width: `${goal.progress || 0}%`,
                }}
              />
            </div>

            <div className="today-footer">
              <span>
                Il tuo percorso è salvato nel tuo account.
              </span>

              <button
                className="danger-link"
                onClick={() => onDelete(goal.id)}
              >
                Elimina obiettivo
              </button>
            </div>
          </section>

          <section className="grid-2">
            {goals.slice(0, 4).map((item) => (
              <div
                className="panel goal-panel"
                key={item.id}
              >
                <div className="goal-icon violet">
                  <Target size={20} />
                </div>

                <div className="goal-panel-head">
                  <span>{item.category}</span>
                  <strong>
                    {item.progress || 0}%
                  </strong>
                </div>

                <h3>{item.title}</h3>

                <p>
                  {item.duration_days} giorni
                </p>

                <div className="goal-bar">
                  <span
                    style={{
                      width: `${item.progress || 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function EmptyGoals({ onCreate }) {
  return (
    <section className="empty-goals">
      <div className="empty-icon">
        <Target size={28} />
      </div>

      <h2>Ancora nessun obiettivo.</h2>

      <p>
        Crea il tuo primo obiettivo e inizia il tuo
        percorso con LifePilot.
      </p>

      <button
        className="primary-btn"
        onClick={onCreate}
      >
        <Plus size={18} />
        Crea il primo obiettivo
      </button>
    </section>
  );
}

function Goals({
  goals,
  loading,
  onCreate,
  onDelete,
}) {
  return (
    <div className="stack">
      <section className="hero-row">
        <div>
          <div className="eyebrow">
            OBIETTIVI
          </div>

          <h1>I miei obiettivi</h1>

          <p>
            Tutto ciò che vuoi costruire, in un unico
            posto.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={onCreate}
        >
          <Plus size={18} />
          Nuovo obiettivo
        </button>
      </section>

      {loading ? (
        <div className="panel loading-panel">
          Caricamento...
        </div>
      ) : goals.length === 0 ? (
        <EmptyGoals onCreate={onCreate} />
      ) : (
        <div className="grid-2">
          {goals.map((goal) => (
            <article
              className="panel goal-panel"
              key={goal.id}
            >
              <div className="goal-icon violet">
                <Target size={20} />
              </div>

              <div className="goal-panel-head">
                <span>{goal.category}</span>

                <strong>
                  {goal.progress || 0}%
                </strong>
              </div>

              <h3>{goal.title}</h3>

              <p>
                {goal.duration_days} giorni ·{" "}
                {goal.streak || 0} giorni di streak
              </p>

              <div className="goal-bar">
                <span
                  style={{
                    width: `${goal.progress || 0}%`,
                  }}
                />
              </div>

              <button
                className="danger-link"
                onClick={() => onDelete(goal.id)}
              >
                Elimina
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Progress({ goals }) {
  const average =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce(
            (sum, goal) =>
              sum + Number(goal.progress || 0),
            0
          ) / goals.length
        );

  return (
    <div className="stack">
      <section className="hero-row">
        <div>
          <div className="eyebrow">
            PROGRESSI
          </div>

          <h1>Stai andando avanti.</h1>

          <p>
            Guarda il quadro generale dei tuoi obiettivi.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <Target size={20} />
          <span>Obiettivi</span>
          <strong>{goals.length}</strong>
        </div>

        <div className="stat-card">
          <Trophy size={20} />
          <span>Progressi medi</span>
          <strong>{average}%</strong>
        </div>

        <div className="stat-card">
          <Flame size={20} />
          <span>Streak migliore</span>
          <strong>
            {Math.max(
              0,
              ...goals.map(
                (goal) => Number(goal.streak || 0)
              )
            )}
          </strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Panoramica</h2>
            <p>
              Il progresso dei tuoi obiettivi.
            </p>
          </div>
        </div>

        <div className="progress-list">
          {goals.map((goal) => (
            <div
              className="progress-row"
              key={goal.id}
            >
              <div>
                <strong>{goal.title}</strong>
                <span>{goal.category}</span>
              </div>

              <div className="progress-value">
                {goal.progress || 0}%
              </div>
            </div>
          ))}

          {goals.length === 0 && (
            <p className="muted">
              Crea il tuo primo obiettivo per vedere i
              progressi.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Coach() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Ciao! Sono il Coach di LifePilot. Raccontami cosa vuoi migliorare oggi.",
    },
  ]);

  function send() {
    const text = message.trim();

    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text,
      },
      {
        role: "assistant",
        text:
          "Ho ricevuto il tuo messaggio. Il collegamento al Coach AI verrà utilizzato qui per costruire il prossimo passo personalizzato.",
      },
    ]);

    setMessage("");
  }

  return (
    <div className="stack">
      <section className="hero-row">
        <div>
          <div className="eyebrow">
            COACH AI
          </div>

          <h1>Un passo alla volta.</h1>

          <p>
            Scrivi cosa vuoi ottenere o cosa ti sta
            bloccando.
          </p>
        </div>
      </section>

      <section className="coach-panel">
        <div className="chat">
          {messages.map((item, index) => (
            <div
              className={
                item.role === "user"
                  ? "chat-row user"
                  : "chat-row"
              }
              key={index}
            >
              <div
                className={
                  item.role === "user"
                    ? "chat-user"
                    : "chat-avatar"
                }
              >
                {item.role === "user" ? (
                  <User size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
              </div>

              <div className="chat-bubble">
                {item.text}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-composer">
          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Scrivi un messaggio..."
          />

          <button
            className="primary-btn icon-only"
            onClick={send}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

function Profile({
  user,
  name,
  onLogout,
}) {
  return (
    <div className="stack">
      <section className="hero-row">
        <div>
          <div className="eyebrow">
            PROFILO
          </div>

          <h1>Il tuo account.</h1>

          <p>
            Gestisci il tuo profilo LifePilot.
          </p>
        </div>
      </section>

      <section className="profile-card panel">
        <div className="profile-avatar">
          {getInitial(name)}
        </div>

        <div className="profile-info">
          <span>Nome</span>
          <strong>{name}</strong>

          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
      </section>

      <button
        className="logout-large"
        onClick={onLogout}
      >
        <LogOut size={18} />
        Esci da LifePilot
      </button>
    </div>
  );
}

function CreateGoalModal({
  onClose,
  onCreate,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState("Personale");
  const [duration, setDuration] =
    useState(30);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!title.trim()) return;

    setBusy(true);

    await onCreate({
      title: title.trim(),
      category,
      duration_days: duration,
    });

    setBusy(false);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              NUOVO PERCORSO
            </span>

            <h2>Crea un obiettivo</h2>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={submit}
        >
          <label>
            Cosa vuoi raggiungere?
            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Es. Allenarmi 3 volte a settimana"
              required
            />
          </label>

          <label>
            Categoria
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              <option>Personale</option>
              <option>Fitness</option>
              <option>Salute</option>
              <option>Studio</option>
              <option>Lavoro</option>
              <option>Finanze</option>
              <option>Relazioni</option>
            </select>
          </label>

          <label>
            Durata
            <select
              value={duration}
              onChange={(e) =>
                setDuration(Number(e.target.value))
              }
            >
              <option value={7}>7 giorni</option>
              <option value={14}>14 giorni</option>
              <option value={30}>30 giorni</option>
              <option value={60}>60 giorni</option>
              <option value={90}>90 giorni</option>
            </select>
          </label>

          <button
            className="primary-btn auth-submit"
            disabled={busy}
            type="submit"
          >
            {busy
              ? "Salvataggio..."
              : "Crea obiettivo"}

            {!busy && <ArrowRight size={17} />}
          </button>
        </form>
      </div>
    </div>
  );
}

function BottomNavItem({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      className={
        active
          ? "bottom-item active"
          : "bottom-item"
      }
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.78-.07-1.53-.22-2.23H12v4.22h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.38Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.53 13.83A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.83V7.64H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.36l3.25-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.14c1.43 0 2.72.49 3.73 1.45l2.79-2.79C16.84 3.21 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53C6.3 7.86 8.46 6.14 12 6.14Z"
      />
    </svg>
  );
}

function getInitial(name) {
  return String(name || "U")
    .trim()
    .charAt(0)
    .toUpperCase();
}

function capitalize(value) {
  const text = String(value || "");

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getAuthError(error) {
  const message = error?.message || "";

  if (
    message.toLowerCase().includes("invalid login credentials")
  ) {
    return "Email o password non corretti.";
  }

  if (
    message.toLowerCase().includes("email not confirmed")
  ) {
    return "Devi prima confermare il tuo indirizzo email.";
  }

  if (
    message.toLowerCase().includes("user already registered")
  ) {
    return "Esiste già un account con questa email.";
  }

  return message || "Si è verificato un errore.";
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
