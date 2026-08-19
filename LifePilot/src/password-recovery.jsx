import React, { useState } from "react";
import { ArrowRight, CheckCircle2, KeyRound, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase";

export function ForgotPasswordPanel({ onBack }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error("Inserisci la tua email.");
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (resetError) throw resetError;
      setMessage("Ti abbiamo inviato un link per reimpostare la password. Controlla la posta elettronica.");
    } catch (err) {
      setError(err?.message || "Non è stato possibile inviare il link.");
    } finally { setBusy(false); }
  }

  return <div className="center-screen"><div className="profile-card auth-recovery-card">
    <div className="profile-setup-icon"><KeyRound size={22}/></div>
    <span className="eyebrow">RECUPERO PASSWORD</span>
    <h1>Hai dimenticato la password?</h1>
    <p className="muted">Inserisci l'email del tuo account. Riceverai un link sicuro per scegliere una nuova password.</p>
    <form className="form" onSubmit={submit}>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label>
      {error && <div className="message error">{error}</div>}
      {message && <div className="message success"><CheckCircle2 size={16}/>{message}</div>}
      <button className="primary-btn full" disabled={busy}>{busy ? "Invio..." : "Invia link di recupero"}<ArrowRight size={17}/></button>
    </form>
    <button className="text-btn" type="button" onClick={onBack}>Torna all'accesso</button>
  </div></div>;
}

export function PasswordRecovery() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError("");
    if (password.length < 6) { setError("La nuova password deve contenere almeno 6 caratteri."); return; }
    if (password !== confirm) { setError("Le password non coincidono."); return; }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(async () => { await supabase.auth.signOut({ scope: "local" }); window.location.href = "/"; }, 1200);
    } catch (err) { setError(err?.message || "Impossibile cambiare la password."); }
    finally { setBusy(false); }
  }

  if (done) return <div className="center-screen"><div className="profile-card"><div className="profile-setup-icon"><CheckCircle2 size={22}/></div><span className="eyebrow">PASSWORD AGGIORNATA</span><h1>Tutto fatto.</h1><p className="muted">La password è stata aggiornata. Ti riportiamo alla schermata di accesso.</p></div></div>;
  return <div className="center-screen"><div className="profile-card auth-recovery-card">
    <div className="profile-setup-icon"><KeyRound size={22}/></div>
    <span className="eyebrow">NUOVA PASSWORD</span>
    <h1>Scegli una nuova password.</h1>
    <p className="muted">Usa almeno 6 caratteri e poi accedi nuovamente al tuo account.</p>
    <form className="form" onSubmit={submit}>
      <label>Nuova password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} autoComplete="new-password" required/></label>
      <label>Conferma password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={6} autoComplete="new-password" required/></label>
      {error && <div className="message error">{error}</div>}
      <button className="primary-btn full" disabled={busy}>{busy ? "Aggiornamento..." : "Salva nuova password"}<ArrowRight size={17}/></button>
    </form>
  </div></div>;
}
