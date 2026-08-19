import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, BarChart3, CalendarDays, Check, ChevronRight, Flame, LogOut, Menu, Palette, Plus, Settings, Sparkles, Target, Trash2, Trophy, User, X } from "lucide-react";
import { supabase, supabaseEnabled } from "./lib/supabase";
import "./styles.css";

const THEMES = [
  ["violet", "Violet"],
  ["ocean", "Oceano"],
  ["emerald", "Smeraldo"],
  ["amber", "Ambra"],
  ["rose", "Rosa"],
  ["night", "Notte"],
];

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("lifepilot-theme") || "violet";
    document.documentElement.dataset.theme = saved;
    let mounted = true;
    if (!supabaseEnabled || !supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session || null); setLoading(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next || null));
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (loading) return <LoadingScreen />;
  if (!supabaseEnabled || !supabase) return <ConfigurationScreen />;
  if (!session) return <AuthScreen />;
  return <AuthenticatedApp session={session} />;
}

function LoadingScreen() { return <div className="loading-screen"><div className="loading-logo"><Sparkles size={23}/></div><strong>LifePilot</strong><span>Caricamento...</span></div>; }
function ConfigurationScreen() { return <div className="center-screen"><div className="card"><Brand/><span className="eyebrow">CONFIGURAZIONE</span><h1>Connessione non disponibile</h1><p>Controlla le variabili Supabase del progetto Vercel.</p></div></div>; }
function Brand() { return <div className="brand"><span className="brand-mark"><Sparkles size={17}/></span><span>LifePilot</span></div>; }

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const reset = () => { setError(""); setMessage(""); };

  async function handleEmailAuth(e) {
    e.preventDefault(); setBusy(true); reset();
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error("Inserisci la tua email.");
      if (password.length < 6) throw new Error("La password deve contenere almeno 6 caratteri.");
      if (mode === "signup") {
        // Important: a new registration must never inherit an already active session.
        await supabase.auth.signOut({ scope: "local" });
        const { data, error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (signUpError) throw signUpError;
        if (!data.session) setMessage("Account creato. Controlla la tua email per confermarlo, poi accedi.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (signInError) throw signInError;
      }
    } catch (err) { setError(getAuthError(err)); }
    finally { setBusy(false); }
  }

  async function handleGoogle() {
    setBusy(true); reset();
    try {
      await supabase.auth.signOut({ scope: "local" });
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/callback` } });
      if (error) throw error;
    } catch (err) { setError(err?.message || "Impossibile avviare Google."); setBusy(false); }
  }

  return <div className="auth-page">
    <header className="auth-topbar"><Brand/><div className="auth-switch">{mode === "login" ? <>Non hai un account? <button onClick={() => {setMode("signup");reset();}}>Registrati</button></> : <>Hai già un account? <button onClick={() => {setMode("login");reset();}}>Accedi</button></>}</div></header>
    <main className="auth-layout"><section className="auth-intro"><span className="auth-eyebrow">IL TUO SPAZIO PERSONALE</span><h1>La tua vita.<br/><span>Un passo alla volta.</span></h1><p>Obiettivi, costanza e progressi in uno spazio personale costruito intorno a te.</p><div className="auth-benefits"><AuthBenefit icon={<Target size={17}/>} title="Obiettivi chiari" text="Dai una direzione a ciò che vuoi raggiungere."/><AuthBenefit icon={<Flame size={17}/>} title="Costanza quotidiana" text="Costruisci il tuo percorso giorno dopo giorno."/><AuthBenefit icon={<BarChart3 size={17}/>} title="Progressi reali" text="Tieni sotto controllo quanto stai avanzando."/></div></section>
      <section className="auth-form-area"><div className="auth-card"><div className="auth-card-heading"><div className="auth-card-icon">{mode === "login" ? <Sparkles size={20}/> : <Target size={20}/>}</div><div><span className="eyebrow">{mode === "login" ? "BENTORNATO" : "INIZIAMO"}</span><h2>{mode === "login" ? "Accedi a LifePilot" : "Crea il tuo account"}</h2></div></div><p className="muted">{mode === "login" ? "Riprendi il tuo percorso." : "Prima di entrare creerai il tuo profilo personale."}</p>
        <button className="google-btn" disabled={busy} onClick={handleGoogle}><GoogleIcon/>Continua con Google</button><div className="divider">oppure continua con email</div>
        <form onSubmit={handleEmailAuth} className="form"><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} required/></label>{error && <div className="message error">{error}</div>}{message && <div className="message success">{message}</div>}<button className="primary-btn full" disabled={busy}>{busy ? "Attendi..." : mode === "login" ? "Accedi a LifePilot" : "Crea account"}<ArrowRight size={17}/></button></form>
      </div></section></main>
  </div>;
}
function AuthBenefit({icon,title,text}) { return <div className="auth-benefit"><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>; }
function GoogleIcon(){return <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.23c0-.79-.07-1.55-.23-2.28H12v4.31h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.39Z"/><path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.5A9.74 9.74 0 0 0 12 21.6Z"/><path fill="#FBBC05" d="M6.54 13.7a5.85 5.85 0 0 1 0-3.4V7.8H3.29a9.68 9.68 0 0 0 0 8.4l3.25-2.5Z"/><path fill="#EA4335" d="M12 6.27c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.34 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.71 5.4l3.25 2.5C7.31 7.99 9.46 6.27 12 6.27Z"/></svg>; }

function AuthenticatedApp({session}) {
  const [profile,setProfile]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{let mounted=true; supabase.from("profiles").select("id,nickname,birth_date").eq("id",session.user.id).maybeSingle().then(({data,error})=>{if(!mounted)return; if(error)console.error(error); setProfile(data||null); setLoading(false);}); return()=>{mounted=false};},[session.user.id]);
  if(loading)return <LoadingScreen/>;
  if(!profile)return <ProfileSetup user={session.user} onComplete={setProfile}/>;
  return <Dashboard session={session} profile={profile}/>;
}

function ProfileSetup({user,onComplete}){
 const [nickname,setNickname]=useState(""); const [birthDate,setBirthDate]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function save(e){e.preventDefault();const name=nickname.trim();if(name.length<2){setError("Scegli un nickname di almeno 2 caratteri.");return;}if(!birthDate){setError("Inserisci la tua data di nascita.");return;}setBusy(true);setError("");try{const {data,error}=await supabase.from("profiles").upsert({id:user.id,nickname:name,birth_date:birthDate},{onConflict:"id"}).select("id,nickname,birth_date").single();if(error)throw error;onComplete(data);}catch(err){setError(err?.message||"Impossibile salvare il profilo.");}finally{setBusy(false);}}
 return <div className="center-screen"><div className="profile-card"><div className="profile-setup-icon"><Sparkles size={22}/></div><span className="eyebrow">BENVENUTO IN LIFEPILOT</span><h1>Prima conosciamo te.</h1><p className="muted">Il profilo è nuovo e appartiene esclusivamente a questo account.</p><form className="form" onSubmit={save}><label>Il tuo nickname<input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Come vuoi essere chiamato?" autoFocus maxLength={30} required/></label><label>Data di nascita<input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/></label>{error&&<div className="message error">{error}</div>}<button className="primary-btn full" disabled={busy}>{busy?"Salvataggio...":"Crea il mio profilo"}<ArrowRight size={17}/></button></form></div></div>;
}

function Dashboard({session,profile}){
 const [view,setView]=useState("home"); const [mobileOpen,setMobileOpen]=useState(false); const [goals,setGoals]=useState([]); const [loading,setLoading]=useState(true); const [createOpen,setCreateOpen]=useState(false);
 const user=session.user; const name=profile.nickname;
 const navigate=v=>{setView(v);setMobileOpen(false)};
 useEffect(()=>{loadGoals();},[user.id]);
 async function loadGoals(){setLoading(true);const {data,error}=await supabase.from("goals").select("*").eq("user_id",user.id).order("created_at",{ascending:false});if(error)console.error(error);setGoals(data||[]);setLoading(false);}
 async function createGoal(g){const {data,error}=await supabase.from("goals").insert({user_id:user.id,title:g.title.trim(),category:g.category,duration_days:Number(g.duration),progress:0,streak:0}).select().single();if(error){alert(error.message);return;}setGoals(x=>[data,...x]);setCreateOpen(false);}
 async function deleteGoal(id){if(!confirm("Eliminare questo obiettivo?"))return;const {error}=await supabase.from("goals").delete().eq("id",id).eq("user_id",user.id);if(error)alert(error.message);else setGoals(x=>x.filter(g=>g.id!==id));}
 async function logout(){const {error}=await supabase.auth.signOut();if(error)alert(error.message);else{setView("home");setMobileOpen(false);}}
 return <div className="app"><header className="topbar"><button className="mobile-menu icon-btn" onClick={()=>setMobileOpen(true)} aria-label="Apri menu"><Menu size={22}/></button><button className="brand" onClick={()=>navigate("home")}><span className="brand-mark"><Sparkles size={17}/></span>LifePilot</button><div className="topbar-actions"><button className="user-mini" onClick={()=>navigate("profile")} title="Profilo">{getInitial(name)}</button><button className="top-logout" onClick={logout} title="Logout"><LogOut size={17}/><span>Logout</span></button></div></header>
 {mobileOpen&&<div className="drawer-backdrop" onClick={()=>setMobileOpen(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><Brand/><button className="icon-btn" onClick={()=>setMobileOpen(false)}><X/></button></div><DashboardNav view={view} navigate={navigate}/><button className="logout-large" onClick={logout}><LogOut size={18}/>Logout</button></aside></div>}
 <div className="app-layout"><aside className="sidebar"><DashboardNav view={view} navigate={navigate}/><button className="logout-btn" onClick={logout}><LogOut size={17}/>Logout</button></aside><main className="main-content">
 {view==="home"&&<Home name={name} goals={goals} loading={loading} onCreate={()=>setCreateOpen(true)} onGoals={()=>navigate("goals")} onRank={()=>navigate("leaderboard")}/>} 
 {view==="goals"&&<GoalsView goals={goals} loading={loading} onCreate={()=>setCreateOpen(true)} onDelete={deleteGoal}/>} 
 {view==="profile"&&<ProfileView profile={profile} user={user}/>} 
 {view==="leaderboard"&&<Leaderboard/>}
 {view==="settings"&&<SettingsView onLogout={logout}/>} 
 </main></div>{createOpen&&<CreateGoalModal onClose={()=>setCreateOpen(false)} onCreate={createGoal}/>}</div>;
}
function DashboardNav({view,navigate}){return <nav className="nav"><NavItem active={view==="home"} icon={<Sparkles/>} label="Home" onClick={()=>navigate("home")}/><NavItem active={view==="goals"} icon={<Target/>} label="Obiettivi" onClick={()=>navigate("goals")}/><NavItem active={view==="leaderboard"} icon={<Trophy/>} label="Classifica" onClick={()=>navigate("leaderboard")}/><NavItem active={view==="profile"} icon={<User/>} label="Profilo" onClick={()=>navigate("profile")}/><NavItem active={view==="settings"} icon={<Settings/>} label="Impostazioni" onClick={()=>navigate("settings")}/></nav>}
function NavItem({active,icon,label,onClick}){return <button className={`nav-item ${active?"active":""}`} onClick={onClick}><span>{React.cloneElement(icon,{size:18})}</span>{label}</button>}

function Home({name,goals,loading,onCreate,onGoals,onRank}){const goal=goals[0];return <div className="page"><div className="page-header"><div><span className="eyebrow">IL TUO SPAZIO PERSONALE</span><h1>Buongiorno, <span>{name}</span></h1><p>Costruiamo qualcosa di importante, un passo alla volta.</p></div><div className="today-badge"><CalendarDays size={17}/>Oggi</div></div>{loading?<div className="panel">Caricamento...</div>:!goal?<div className="panel hero-empty"><Target size={30}/><div><span className="eyebrow">IL TUO SPAZIO È PRONTO</span><h2>Da dove vuoi iniziare?</h2><p>Crea il tuo primo obiettivo e costruisci il tuo percorso.</p><button className="primary-btn" onClick={onCreate}>Crea obiettivo<Plus size={17}/></button></div></div>:<div className="dashboard-grid"><section className="panel"><div className="section-head"><div><span className="eyebrow">IL TUO OBIETTIVO</span><h2>{goal.title}</h2></div><Target/></div><div className="progress-label"><span>Progressi</span><strong>{Number(goal.progress||0)}%</strong></div><div className="progress"><i style={{width:`${Math.min(100,Math.max(0,Number(goal.progress||0)))}%`}}/></div><div className="stats"><Stat icon={<Flame/>} label="Streak" value={`${goal.streak||0} giorni`}/><Stat icon={<CalendarDays/>} label="Durata" value={`${goal.duration_days||0} giorni`}/><Stat icon={<Trophy/>} label="Obiettivi" value={goals.length}/></div><button className="secondary-btn" onClick={onGoals}>Gestisci obiettivi<ChevronRight size={16}/></button></section><section className="panel"><span className="eyebrow">OGGI</span><h3>Il tuo prossimo passo</h3><div className="empty-task"><Check size={22}/><strong>Nessuna attività per oggi</strong><p>Le tue attività appariranno qui.</p></div></section></div>}<div className="quick-grid"><button className="quick-card" onClick={onCreate}><Plus/><strong>Nuovo obiettivo</strong><span>Inizia qualcosa di nuovo.</span></button><button className="quick-card" onClick={onRank}><Trophy/><strong>Classifica</strong><span>Confronta i tuoi progressi.</span></button><button className="quick-card" onClick={()=>document.querySelector(".top-logout")?.focus()}><Settings/><strong>Impostazioni</strong><span>Personalizza LifePilot.</span></button></div></div>}
function Stat({icon,label,value}){return <div className="stat"><span>{React.cloneElement(icon,{size:17})}</span><div><small>{label}</small><strong>{value}</strong></div></div>}

function GoalsView({goals,loading,onCreate,onDelete}){return <div className="page"><div className="page-header"><div><span className="eyebrow">IL TUO PERCORSO</span><h1>I miei obiettivi</h1><p>Tutto ciò che vuoi costruire, in un unico posto.</p></div><button className="primary-btn" onClick={onCreate}><Plus size={17}/>Nuovo obiettivo</button></div>{loading?<div className="panel">Caricamento...</div>:goals.length===0?<div className="panel hero-empty"><Target size={30}/><div><h2>Nessun obiettivo</h2><p>Il tuo percorso parte da qui.</p><button className="primary-btn" onClick={onCreate}>Crea obiettivo</button></div></div>:<div className="goals-list">{goals.map(g=><article className="goal-card" key={g.id}><div className="goal-icon"><Target/></div><div className="goal-content"><span className="eyebrow">{g.category||"PERSONALE"}</span><h3>{g.title}</h3><div className="progress"><i style={{width:`${Math.min(100,Math.max(0,Number(g.progress||0)))}%`}}/></div></div><div className="goal-side"><span>{g.progress||0}%</span><small>{g.duration_days||0} giorni</small><button className="icon-btn danger" onClick={()=>onDelete(g.id)}><Trash2 size={17}/></button></div></article>)}</div>}</div>}

function ProfileView({profile,user}){return <div className="page"><span className="eyebrow">IL TUO ACCOUNT</span><h1>Profilo</h1><p className="muted">Il profilo è separato dall'email di accesso.</p><div className="panel profile-panel"><div className="avatar-large">{getInitial(profile.nickname)}</div><div className="profile-info"><div><small>Nickname</small><strong>{profile.nickname}</strong></div><div><small>Email</small><strong>{user.email||"—"}</strong></div><div><small>Data di nascita</small><strong>{formatBirthDate(profile.birth_date)}</strong></div></div></div></div>}

function Leaderboard(){const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");useEffect(()=>{supabase.rpc("get_public_leaderboard").then(({data,error})=>{setRows(data||[]);if(error)setError(error.message);setLoading(false);});},[]);return <div className="page"><span className="eyebrow">PROGRESSI</span><h1>Classifica</h1><p className="muted">Una classifica pubblica con nickname e punteggio, senza email.</p>{error&&<div className="message error">{error}</div>}{loading?<div className="panel">Caricamento...</div>:<div className="leaderboard">{rows.length===0?<div className="panel">Ancora nessun partecipante.</div>:rows.map((r,i)=><div className="rank-row" key={`${r.nickname}-${i}`}><strong className="rank">{i+1}</strong><span className="rank-avatar">{getInitial(r.nickname)}</span><div className="rank-name"><strong>{r.nickname}</strong><small>{r.goals} obiettivi · {Math.round(Number(r.avg_progress||0))}% medio</small></div><strong className="score">{r.score} pt</strong></div>)}</div>}</div>}

function SettingsView({onLogout}){const [theme,setTheme]=useState(localStorage.getItem("lifepilot-theme")||"violet");function change(v){setTheme(v);document.documentElement.dataset.theme=v;localStorage.setItem("lifepilot-theme",v);}return <div className="page"><span className="eyebrow">PERSONALIZZAZIONE</span><h1>Impostazioni</h1><p className="muted">Personalizza l'aspetto e gestisci la sessione.</p><section className="panel settings-panel"><div className="settings-heading"><Palette/><div><h3>Tema</h3><p>Scegli il colore che preferisci.</p></div></div><div className="theme-grid">{THEMES.map(([id,label])=><button key={id} className={`theme-option ${theme===id?"selected":""}`} onClick={()=>change(id)}><span className={`theme-dot ${id}`}/>{label}{theme===id&&<Check size={16}/>}</button>)}</div></section><section className="panel logout-panel"><LogOut/><div><h3>Esci da LifePilot</h3><p>Chiudi completamente la sessione corrente.</p></div><button className="primary-btn" onClick={onLogout}>Logout</button></section></div>}

function CreateGoalModal({onClose,onCreate}){const [title,setTitle]=useState("");const [category,setCategory]=useState("Personale");const [duration,setDuration]=useState("30");return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">NUOVO OBIETTIVO</span><h2>Cosa vuoi raggiungere?</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div><form className="form" onSubmit={e=>{e.preventDefault();if(title.trim())onCreate({title,category,duration});}}><label>Obiettivo<input value={title} onChange={e=>setTitle(e.target.value)} required autoFocus/></label><label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}><option>Personale</option><option>Salute</option><option>Fitness</option><option>Lavoro</option><option>Studio</option><option>Finanze</option><option>Relazioni</option><option>Altro</option></select></label><label>Durata<select value={duration} onChange={e=>setDuration(e.target.value)}><option value="7">7 giorni</option><option value="14">14 giorni</option><option value="30">30 giorni</option><option value="60">60 giorni</option><option value="90">90 giorni</option></select></label><div className="modal-actions"><button className="secondary-btn" type="button" onClick={onClose}>Annulla</button><button className="primary-btn">Crea obiettivo<ArrowRight size={17}/></button></div></form></div></div>}

function getInitial(v){return v?.trim()?.charAt(0)?.toUpperCase()||"U";}
function formatBirthDate(v){if(!v)return "—";const d=new Date(`${v}T00:00:00`);return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"long",year:"numeric"}).format(d);}
function getAuthError(e){const m=e?.message||"Si è verificato un errore.";const l=m.toLowerCase();if(l.includes("invalid login credentials"))return "Email o password non corretti.";if(l.includes("email not confirmed"))return "Conferma prima la tua email.";if(l.includes("user already registered"))return "Esiste già un account con questa email.";return m;}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
