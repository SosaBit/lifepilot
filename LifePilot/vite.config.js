import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const recoveryImport = 'import { ForgotPasswordPanel, PasswordRecovery } from "./password-recovery.jsx";\n'

const appReplacement = `function App(){
  const [session,setSession]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{document.documentElement.dataset.theme=localStorage.getItem("lifepilot-theme")||"violet";let mounted=true;
    if(!supabaseEnabled||!supabase){setLoading(false);return;}
    supabase.auth.getSession().then(({data})=>{if(mounted){setSession(data.session||null);setLoading(false);}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,next)=>setSession(next||null));
    return()=>{mounted=false;subscription.unsubscribe()};
  },[]);
  if(window.location.pathname==="/reset-password") return <PasswordRecovery/>;
  if(loading)return <LoadingScreen/>;if(!supabaseEnabled||!supabase)return <ConfigurationScreen/>;if(!session)return <AuthScreen/>;return <AuthenticatedApp session={session}/>;
}`

const authReplacement = `function AuthScreen(){
  const [mode,setMode]=useState("login");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
  const reset=()=>{setError("");setMessage("")};
  async function handleEmailAuth(e){e.preventDefault();setBusy(true);reset();try{const cleanEmail=email.trim().toLowerCase();if(!cleanEmail)throw new Error("Inserisci la tua email.");if(password.length<6)throw new Error("La password deve contenere almeno 6 caratteri.");
    if(mode==="signup"){await supabase.auth.signOut({scope:"local"});const {data,error:signUpError}=await supabase.auth.signUp({email:cleanEmail,password});if(signUpError)throw signUpError;if(data.session){setMessage("Account creato. Ora crea il tuo profilo personale.")}else{setMessage("Account creato. Controlla la tua email per confermarlo, poi accedi: il profilo verrà creato da zero.")}}
    else{const {error:signInError}=await supabase.auth.signInWithPassword({email:cleanEmail,password});if(signInError)throw signInError}
  }catch(err){setError(getAuthError(err))}finally{setBusy(false)}}
  async function handleGoogle(){setBusy(true);reset();try{await supabase.auth.signOut({scope:"local"});const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`\${window.location.origin}/callback`,queryParams:{prompt:"select_account"}}});if(error)throw error}catch(err){setError(err?.message||"Impossibile avviare Google.");setBusy(false)}}
  if(mode==="forgot")return <ForgotPasswordPanel onBack={()=>{setMode("login");reset()}}/>;
  return <div className="auth-page"><header className="auth-topbar"><Brand/><div className="auth-switch">{mode==="login"?<>Non hai un account? <button onClick={()=>{setMode("signup");reset()}}>Registrati</button></>:<>Hai già un account? <button onClick={()=>{setMode("login");reset()}}>Accedi</button></>}</div></header><main className="auth-layout"><section className="auth-intro"><span className="auth-eyebrow">IL TUO SPAZIO PERSONALE</span><h1>La tua vita.<br/><span>Un passo alla volta.</span></h1><p>Obiettivi, costanza e progressi in uno spazio personale costruito intorno a te.</p><div className="auth-benefits"><AuthBenefit icon={<Target size={17}/>} title="Obiettivi chiari" text="Dai una direzione a ciò che vuoi raggiungere."/><AuthBenefit icon={<Flame size={17}/>} title="Costanza quotidiana" text="Costruisci il tuo percorso giorno dopo giorno."/><AuthBenefit icon={<BarChart3 size={17}/>} title="Progressi reali" text="Tieni sotto controllo quanto stai avanzando."/></div></section><section className="auth-form-area"><div className="auth-card"><div className="auth-card-heading"><div className="auth-card-icon">{mode==="login"?<Sparkles size={20}/>:<Target size={20}/>}</div><div><span className="eyebrow">{mode==="login"?"BENTORNATO":"INIZIAMO"}</span><h2>{mode==="login"?"Accedi a LifePilot":"Crea il tuo account"}</h2></div></div><p className="muted">{mode==="login"?"Riprendi il tuo percorso.":"Il nuovo account avrà un profilo personale separato."}</p><button className="google-btn" disabled={busy} onClick={handleGoogle}><GoogleIcon/>Continua con Google</button><div className="divider">oppure continua con email</div><form onSubmit={handleEmailAuth} className="form"><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} autoComplete={mode==="login"?"current-password":"new-password"} required/></label>{error&&<div className="message error">{error}</div>}{message&&<div className="message success">{message}</div>}<button className="primary-btn full" disabled={busy}>{busy?"Attendi...":mode==="login"?"Accedi a LifePilot":"Crea account"}<ArrowRight size={17}/></button></form>{mode==="login"&&<button className="text-btn" type="button" onClick={()=>{setMode("forgot");reset()}}>Password dimenticata? Recuperala</button>}</div></section></main></div>}
`

export default defineConfig({
  plugins: [
    {
      name: 'lifepilot-auth-and-runtime-fix',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('/src/main.jsx')) return
        let next = code
        if (!next.includes('from "./password-recovery.jsx"')) next = recoveryImport + next
        if (!next.includes('import { createRoot } from "react-dom/client"')) next = 'import { createRoot } from "react-dom/client";\n' + next
        next = next.replace(/function App\(\)\{[\s\S]*?\}\nfunction LoadingScreen/, `${appReplacement}\nfunction LoadingScreen`)
        next = next.replace(/function AuthScreen\(\)\{[\s\S]*?\}\nfunction AuthBenefit/, `${authReplacement}\nfunction AuthBenefit`)
        return { code: next, map: null }
      },
    },
    react(),
  ],
})
