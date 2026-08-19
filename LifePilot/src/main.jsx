 import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Flame,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  User,
  X,
} from "lucide-react";

import { supabase, supabaseEnabled } from "./lib/supabase";
import "./styles.css";

/* =========================================================
   APP
   ========================================================= */

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

  if (!supabaseEnabled || !supabase) {
    return <ConfigurationScreen />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <AuthenticatedApp session={session} />;
}

/* =========================================================
   LOADING
   ========================================================= */

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <Sparkles size={23} />
      </div>

      <strong>LifePilot</strong>
      <span>Caricamento...</span>
    </div>
  );
}

/* =========================================================
   CONFIGURATION
   ========================================================= */

function ConfigurationScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card configuration-card">
        <div className="brand large">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>

          <span>LifePilot</span>
        </div>

        <div className="eyebrow">CONFIGURAZIONE</div>

        <h1>Connessione non disponibile</h1>

        <p>
          LifePilot non riesce a collegarsi a Supabase.
          Controlla le variabili di ambiente del progetto Vercel.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   AUTH
   ========================================================= */

function AuthScreen() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function resetMessages() {
    setError("");
    setMessage("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    resetMessages();
  }

  async function handleEmailAuth(event) {
    event.preventDefault();

    setBusy(true);
    resetMessages();

    try {
      if (!email.trim()) {
        throw new Error("Inserisci la tua email.");
      }

      if (password.length < 6) {
        throw new Error(
          "La password deve contenere almeno 6 caratteri."
        );
      }

      if (mode === "signup") {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

        if (signUpError) {
          throw signUpError;
        }

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

        if (signInError) {
          throw signInError;
        }
      }
    } catch (err) {
      setError(getAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    resetMessages();

    try {
      const redirectUrl =
        "https://lifepilot-26vdyare5-brandecho2k25-8479s-projects.vercel.app";

      const { error: googleError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

      if (googleError) {
        throw googleError;
      }
    } catch (err) {
      setError(
        err?.message ||
          "Impossibile avviare l'accesso con Google."
      );

      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-background-glow auth-glow-one" />
      <div className="auth-background-glow auth-glow-two" />

      <header className="auth-topbar">
        <button
          className="brand"
          type="button"
          onClick={() => switchMode("login")}
        >
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
      </header>

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
              <AuthBenefit
                icon={<Target size={17} />}
                title="Obiettivi chiari"
                text="Dai una direzione a ciò che vuoi raggiungere."
              />

              <AuthBenefit
                icon={<Flame size={17} />}
                title="Costanza quotidiana"
                text="Costruisci il tuo percorso giorno dopo giorno."
              />

              <AuthBenefit
                icon={<BarChart3 size={17} />}
                title="Progressi reali"
                text="Tieni sotto controllo quanto stai avanzando."
              />
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
              <label>
                Email

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
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
                  onChange={(event) =>
                    setPassword(event.target.value)
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
                  <span>Non hai ancora un account?</span>

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
                Il tuo spazio personale rimane collegato
                esclusivamente al tuo account.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthBenefit({ icon, title, text }) {
  return (
    <div className="auth-benefit">
      <span className="benefit-icon">{icon}</span>

      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}

/* =========================================================
   AUTHENTICATED APP
   ========================================================= */

function AuthenticatedApp({ session }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoadingProfile(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, birth_date")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error(
          "Errore caricamento profilo:",
          error
        );

        setProfile(null);
      } else {
        setProfile(data || null);
      }

      setLoadingProfile(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session.user.id]);

  if (loadingProfile) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <ProfileSetup
        user={session.user}
        onComplete={setProfile}
      />
    );
  }

  return (
    <Dashboard
      session={session}
      profile={profile}
    />
  );
}

/* =========================================================
   PROFILE SETUP
   ========================================================= */

function ProfileSetup({ user, onComplete }) {
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveProfile(event) {
    event.preventDefault();

    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setError(
        "Scegli il nickname che vuoi usare su LifePilot."
      );
      return;
    }

    if (cleanNickname.length < 2) {
      setError(
        "Il nickname deve contenere almeno 2 caratteri."
      );
      return;
    }

    if (!birthDate) {
      setError("Inserisci la tua data di nascita.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { data, error: profileError } =
        await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              nickname: cleanNickname,
              birth_date: birthDate,
            },
            {
              onConflict: "id",
            }
          )
          .select("id, nickname, birth_date")
          .single();

      if (profileError) {
        throw profileError;
      }

      onComplete(data);
    } catch (err) {
      console.error(err);

      setError(
        "Non è stato possibile salvare il profilo. Riprova."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-setup-page">
      <div className="auth-background-glow auth-glow-one" />

      <div className="profile-setup-card">
        <div className="profile-setup-icon">
          <Sparkles size={22} />
        </div>

        <div className="eyebrow">
          BENVENUTO IN LIFEPILOT
        </div>

        <h1>Prima conosciamo te.</h1>

        <p className="profile-setup-description">
          Scegli come vuoi essere chiamato e inserisci la
          tua data di nascita. Da questo momento LifePilot
          sarà il tuo spazio personale.
        </p>

        <form
          className="profile-setup-form"
          onSubmit={saveProfile}
        >
          <label>
            Il tuo nickname

            <input
              type="text"
              value={nickname}
              onChange={(event) =>
                setNickname(event.target.value)
              }
              placeholder="Es. Marco, Alex, Miki..."
              maxLength={30}
              autoComplete="nickname"
              autoFocus
              required
            />
          </label>

          <label>
            Data di nascita

            <input
              type="date"
              value={birthDate}
              onChange={(event) =>
                setBirthDate(event.target.value)
              }
              required
            />
          </label>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          <button
            className="primary-btn profile-setup-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Salvataggio..."
              : "Entra in LifePilot"}

            {!busy && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="profile-setup-note">
          <Check size={14} />

          <span>
            Il nickname è indipendente dal nome del tuo
            account Google.
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({ session, profile }) {
  const [view, setView] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);

  const user = session.user;
  const userName = profile.nickname;

  const [today, setToday] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(today);
  }, [today]);

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

    if (error) {
      console.error("Errore caricamento obiettivi:", error);
      setGoals([]);
    } else {
      setGoals(data || []);
    }

    setLoadingGoals(false);
  }

  async function createGoal(goal) {
    const title = goal.title.trim();

    if (!title) return;

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title,
        category: goal.category,
        duration_days: Number(goal.duration_days),
        progress: 0,
        streak: 0,
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      alert(
        "Non è stato possibile creare l'obiettivo."
      );

      return;
    }

    if (data) {
      setGoals((current) => [data, ...current]);
      setCreateOpen(false);
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

    if (error) {
      alert(
        "Non è stato possibile eliminare l'obiettivo."
      );

      return;
    }

    setGoals((current) =>
      current.filter((goal) => goal.id !== id)
    );
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setView("home");
  }

  function navigate(nextView) {
    setView(nextView);
    setMobileOpen(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            type="button"
            aria-label="Apri menu"
          >
            <Menu size={22} />
          </button>

          <button
            className="brand"
            onClick={() => navigate("home")}
            type="button"
          >
            <span className="brand-mark">
              <Sparkles size={17} />
            </span>

            <span>LifePilot</span>
          </button>

          <div className="topbar-actions">
            <button
              className="user-mini"
              onClick={() => navigate("profile")}
              type="button"
              title="Profilo"
            >
              {getInitial(userName)}
            </button>
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
            onClick={(event) =>
              event.stopPropagation()
            }
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
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <DashboardNav
              view={view}
              onNavigate={navigate}
            />

            <button
              className="logout-large"
              onClick={logout}
              type="button"
            >
              <LogOut size={17} />
              <span>Esci</span>
            </button>
          </aside>
        </div>
      )}

      <div className="app-layout">
        <aside className="sidebar">
          <DashboardNav
            view={view}
            onNavigate={navigate}
          />

          <div className="sidebar-bottom">
            <button
              className="logout-btn"
              onClick={logout}
              type="button"
            >
              <LogOut size={17} />
              <span>Esci</span>
            </button>
          </div>
        </aside>

        <main className="main-content">
          {view === "home" && (
            <Home
              name={userName}
              today={formattedToday}
              goal={activeGoal}
              goals={goals}
              loading={loadingGoals}
              onCreate={() => setCreateOpen(true)}
              onViewGoals={() => navigate("goals")}
            />
          )}

          {view === "goals" && (
            <GoalsView
              goals={goals}
              loading={loadingGoals}
              onCreate={() => setCreateOpen(true)}
              onDelete={deleteGoal}
            />
          )}

          {view === "profile" && (
            <ProfileView
              profile={profile}
              user={user}
            />
          )}

          {view === "settings" && (
            <SettingsView
              profile={profile}
              user={user}
              onLogout={logout}
            />
          )}
        </main>
      </div>

      {createOpen && (
        <CreateGoalModal
          onClose={() => setCreateOpen(false)}
          onCreate={createGoal}
        />
      )}
    </div>
  );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function DashboardNav({ view, onNavigate }) {
  return (
    <nav className="dashboard-nav">
      <NavItem
        active={view === "home"}
        icon={<Sparkles size={18} />}
        label="Home"
        onClick={() => onNavigate("home")}
      />

      <NavItem
        active={view === "goals"}
        icon={<Target size={18} />}
        label="Obiettivi"
        onClick={() => onNavigate("goals")}
      />

      <NavItem
        active={view === "profile"}
        icon={<User size={18} />}
        label="Profilo"
        onClick={() => onNavigate("profile")}
      />

      <NavItem
        active={view === "settings"}
        icon={<Settings size={18} />}
        label="Impostazioni"
        onClick={() => onNavigate("settings")}
      />
    </nav>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}) {
  return (
    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="nav-item-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/* =========================================================
   HOME
   ========================================================= */

function Home({
  name,
  today,
  goal,
  goals,
  loading,
  onCreate,
  onViewGoals,
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{today}</div>

          <h1>
            Buongiorno, <span>{name}</span>
          </h1>

          <p>
            Costruiamo qualcosa di importante, un passo
            alla volta.
          </p>
        </div>

        <div className="today-badge">
          <CalendarDays size={17} />
          <span>Oggi</span>
        </div>
      </div>

      {loading ? (
        <div className="empty-panel">
          <div className="empty-icon">
            <Sparkles size={22} />
          </div>

          <strong>Sto preparando il tuo spazio...</strong>
        </div>
      ) : !goal ? (
        <EmptyDashboard onCreate={onCreate} />
      ) : (
        <div className="dashboard-grid">
          <section className="goal-panel">
            <div className="goal-panel-head">
              <div>
                <span className="eyebrow">
                  IL TUO OBIETTIVO
                </span>

                <h2>{goal.title}</h2>
              </div>

              <div className="goal-icon">
                <Target size={20} />
              </div>
            </div>

            <div className="progress-area">
              <div className="progress-labels">
                <span>Progressi</span>
                <strong>
                  {Number(goal.progress || 0)}%
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(goal.progress || 0)
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="goal-stats">
              <Stat
                icon={<Flame size={17} />}
                label="Streak"
                value={`${Number(
                  goal.streak || 0
                )} giorni`}
              />

              <Stat
                icon={<CalendarDays size={17} />}
                label="Durata"
                value={`${Number(
                  goal.duration_days || 0
                )} giorni`}
              />

              <Stat
                icon={<Trophy size={17} />}
                label="Obiettivi"
                value={`${goals.length}`}
              />
            </div>

            <button
              className="secondary-btn"
              onClick={onViewGoals}
              type="button"
            >
              Gestisci obiettivi
              <ChevronRight size={16} />
            </button>
          </section>

          <section className="today-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  OGGI
                </span>

                <h3>Il tuo prossimo passo</h3>
              </div>

              <div className="today-icon">
                <Check size={18} />
              </div>
            </div>

            <div className="today-empty">
              <div className="today-ring">
                <span>0</span>
                <small>task</small>
              </div>

              <strong>
                Nessuna attività per oggi
              </strong>

              <p>
                Quando aggiungerai le tue attività,
                appariranno qui.
              </p>
            </div>
          </section>
        </div>
      )}

      <section className="quick-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SPAZIO PERSONALE</span>
            <h3>Inizia da qui</h3>
          </div>
        </div>

        <div className="quick-grid">
          <button
            className="quick-card"
            onClick={onCreate}
            type="button"
          >
            <span className="quick-card-icon">
              <Plus size={19} />
            </span>

            <strong>Nuovo obiettivo</strong>

            <span>
              Dai una nuova direzione al tuo percorso.
            </span>
          </button>

          <button
            className="quick-card"
            onClick={onViewGoals}
            type="button"
          >
            <span className="quick-card-icon">
              <Target size={19} />
            </span>

            <strong>I miei obiettivi</strong>

            <span>
              Visualizza e gestisci ciò che vuoi raggiungere.
            </span>
          </button>

          <button
            className="quick-card"
            type="button"
          >
            <span className="quick-card-icon">
              <BarChart3 size={19} />
            </span>

            <strong>Progressi</strong>

            <span>
              Tieni sotto controllo il tuo percorso.
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyDashboard({ onCreate }) {
  return (
    <div className="empty-panel large-empty">
      <div className="empty-icon">
        <Target size={25} />
      </div>

      <div>
        <span className="eyebrow">
          IL TUO SPAZIO È PRONTO
        </span>

        <h2>
          Da dove vuoi iniziare?
        </h2>

        <p>
          Non hai ancora creato nessun obiettivo.
          Scegli qualcosa che vuoi migliorare e
          iniziamo insieme.
        </p>

        <button
          className="primary-btn"
          onClick={onCreate}
          type="button"
        >
          Crea il primo obiettivo
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   GOALS
   ========================================================= */

function GoalsView({
  goals,
  loading,
  onCreate,
  onDelete,
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">IL TUO PERCORSO</div>

          <h1>I miei obiettivi</h1>

          <p>
            Tutto ciò che vuoi costruire, in un unico posto.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={onCreate}
          type="button"
        >
          <Plus size={17} />
          Nuovo obiettivo
        </button>
      </div>

      {loading ? (
        <div className="empty-panel">
          <strong>Caricamento obiettivi...</strong>
        </div>
      ) : goals.length === 0 ? (
        <div className="empty-panel large-empty">
          <div className="empty-icon">
            <Target size={24} />
          </div>

          <div>
            <span className="eyebrow">
              NESSUN OBIETTIVO
            </span>

            <h2>
              Il tuo percorso parte da qui.
            </h2>

            <p>
              Crea il tuo primo obiettivo e inizia a
              costruire il percorso che desideri.
            </p>

            <button
              className="primary-btn"
              onClick={onCreate}
              type="button"
            >
              Crea obiettivo
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={() =>
                onDelete(goal.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onDelete }) {
  const progress = Math.min(
    100,
    Math.max(0, Number(goal.progress || 0))
  );

  return (
    <article className="goal-card">
      <div className="goal-card-main">
        <div className="goal-card-icon">
          <Target size={20} />
        </div>

        <div className="goal-card-content">
          <span className="eyebrow">
            {goal.category || "PERSONALE"}
          </span>

          <h3>{goal.title}</h3>

          <div className="goal-card-progress">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <strong>{progress}%</strong>
          </div>
        </div>
      </div>

      <div className="goal-card-side">
        <div>
          <small>Durata</small>
          <strong>
            {Number(goal.duration_days || 0)} giorni
          </strong>
        </div>

        <div>
          <small>Streak</small>
          <strong>
            {Number(goal.streak || 0)} giorni
          </strong>
        </div>

        <button
          className="icon-btn danger-btn"
          onClick={onDelete}
          type="button"
          title="Elimina obiettivo"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   PROFILE
   ========================================================= */

function ProfileView({ profile, user }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">IL TUO ACCOUNT</div>

          <h1>Profilo</h1>

          <p>
            Le informazioni personali che hai scelto per
            LifePilot.
          </p>
        </div>
      </div>

      <section className="profile-panel">
        <div className="profile-avatar-large">
          {getInitial(profile.nickname)}
        </div>

        <div className="profile-info">
          <div className="profile-field">
            <span>Nickname</span>
            <strong>{profile.nickname}</strong>
          </div>

          <div className="profile-field">
            <span>Data di nascita</span>
            <strong>
              {formatBirthDate(profile.birth_date)}
            </strong>
          </div>

          <div className="profile-field">
            <span>Email account</span>
            <strong>{user.email || "—"}</strong>
          </div>

          <div className="profile-field">
            <span>Accesso</span>
            <strong>
              {user.app_metadata?.provider === "google"
                ? "Google"
                : "Email"}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function SettingsView({
  profile,
  user,
  onLogout,
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">LIFEPILOT</div>

          <h1>Impostazioni</h1>

          <p>
            Gestisci il tuo spazio personale.
          </p>
        </div>
      </div>

      <div className="settings-list">
        <section className="settings-card">
          <div className="settings-card-icon">
            <User size={19} />
          </div>

          <div>
            <span className="eyebrow">
              PROFILO
            </span>

            <h3>{profile.nickname}</h3>

            <p>
              Account collegato a{" "}
              {user.email || "il tuo account"}.
            </p>
          </div>
        </section>

        <section className="settings-card danger-card">
          <div className="settings-card-icon">
            <LogOut size={19} />
          </div>

          <div>
            <span className="eyebrow">
              SESSIONE
            </span>

            <h3>Esci da LifePilot</h3>

            <p>
              Chiudi la sessione corrente su questo
              dispositivo.
            </p>

            <button
              className="secondary-btn danger-secondary"
              onClick={onLogout}
              type="button"
            >
              <LogOut size={16} />
              Esci
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   CREATE GOAL MODAL
   ========================================================= */

function CreateGoalModal({
  onClose,
  onCreate,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState("Personale");
  const [duration, setDuration] =
    useState("30");

  function submit(event) {
    event.preventDefault();

    if (!title.trim()) return;

    onCreate({
      title,
      category,
      duration_days: duration,
    });
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              NUOVO OBIETTIVO
            </span>

            <h2>Cosa vuoi raggiungere?</h2>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={submit}
        >
          <label>
            Obiettivo

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Es. Allenarmi con costanza"
              autoFocus
              maxLength={100}
              required
            />
          </label>

          <label>
            Categoria

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option>Personale</option>
              <option>Salute</option>
              <option>Fitness</option>
              <option>Lavoro</option>
              <option>Studio</option>
              <option>Finanze</option>
              <option>Relazioni</option>
              <option>Altro</option>
            </select>
          </label>

          <label>
            Durata

            <select
              value={duration}
              onChange={(event) =>
                setDuration(event.target.value)
              }
            >
              <option value="7">
                7 giorni
              </option>

              <option value="14">
                14 giorni
              </option>

              <option value="30">
                30 giorni
              </option>

              <option value="60">
                60 giorni
              </option>

              <option value="90">
                90 giorni
              </option>

              <option value="180">
                180 giorni
              </option>
            </select>
          </label>

          <div className="modal-actions">
            <button
              className="secondary-btn"
              onClick={onClose}
              type="button"
            >
              Annulla
            </button>

            <button
              className="primary-btn"
              type="submit"
            >
              Crea obiettivo
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   GOOGLE ICON
   ========================================================= */

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="google-icon"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.79-.07-1.55-.23-2.28H12v4.31h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.39Z"
      />

      <path
        fill="#34A853"
        d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.5A9.74 9.74 0 0 0 12 21.6Z"
      />

      <path
        fill="#FBBC05"
        d="M6.54 13.7a5.85 5.85 0 0 1 0-3.4V7.8H3.29a9.68 9.68 0 0 0 0 8.4l3.25-2.5Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.27c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.34 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.71 5.4l3.25 2.5C7.31 7.99 9.46 6.27 12 6.27Z"
      />
    </svg>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function getInitial(value) {
  if (!value) return "U";

  return value
    .trim()
    .charAt(0)
    .toUpperCase();
}

function formatBirthDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getAuthError(error) {
  const message =
    error?.message ||
    "Si è verificato un errore.";

  if (
    message.toLowerCase().includes(
      "invalid login credentials"
    )
  ) {
    return "Email o password non corretti.";
  }

  if (
    message.toLowerCase().includes(
      "email not confirmed"
    )
  ) {
    return "Conferma prima la tua email.";
  }

  if (
    message.toLowerCase().includes(
      "user already registered"
    )
  ) {
    return "Esiste già un account con questa email.";
  }

  return message;
}

/* =========================================================
   ROOT
   ========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
