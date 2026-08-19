const supabase = window.__lifepilotSupabase;

function addRecoveryButton() {
  if (window.location.pathname === "/reset-password") return;
  const form = document.querySelector(".auth-card form");
  if (!form || document.querySelector("[data-lifepilot-recovery]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.lifepilotRecovery = "1";
  button.textContent = "Password dimenticata? Recuperala";
  button.className = "forgot-password-link";
  button.onclick = () => { window.location.href = "/reset-password"; };
  form.parentElement.appendChild(button);
}

async function recoveryPage() {
  if (!supabase || window.location.pathname !== "/reset-password") return;
  const root = document.getElementById("root");
  if (!root) return;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hasRecoverySession = hash.has("access_token") || hash.has("type");
  root.innerHTML = `<div class="center-screen"><div class="card recovery-card"><div class="brand">LifePilot</div><h1>${hasRecoverySession ? "Imposta una nuova password" : "Recupera la password"}</h1><p class="muted">${hasRecoverySession ? "Scegli una nuova password per il tuo account." : "Inserisci la tua email e riceverai un link di recupero."}</p><form id="recovery-form"><label>Email<input id="recovery-email" type="email" required></label><label class="new-password">Nuova password<input id="recovery-password" type="password" minlength="6" required></label><label class="new-password">Conferma password<input id="recovery-confirm" type="password" minlength="6" required></label><div id="recovery-message"></div><button class="primary-btn full" type="submit">${hasRecoverySession ? "Salva nuova password" : "Invia link di recupero"}</button></form><button id="recovery-back" class="secondary-btn">Torna all'accesso</button></div></div>`;
  const form = document.getElementById("recovery-form");
  const email = document.getElementById("recovery-email");
  const pass = document.getElementById("recovery-password");
  const confirm = document.getElementById("recovery-confirm");
  const message = document.getElementById("recovery-message");
  if (hasRecoverySession) { email.parentElement.style.display = "none"; } else { document.querySelectorAll(".new-password").forEach(x => x.style.display = "none"); }
  form.onsubmit = async (event) => {
    event.preventDefault(); message.textContent = "";
    try {
      if (hasRecoverySession) {
        if (pass.value !== confirm.value) throw new Error("Le password non coincidono.");
        const { error } = await supabase.auth.updateUser({ password: pass.value });
        if (error) throw error;
        await supabase.auth.signOut({ scope: "local" });
        message.textContent = "Password aggiornata. Ora puoi accedere.";
        setTimeout(() => window.location.href = "/", 900);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        message.textContent = "Link inviato. Controlla la tua email.";
      }
    } catch (error) { message.textContent = error?.message || "Operazione non riuscita."; }
  };
  document.getElementById("recovery-back").onclick = () => { window.location.href = "/"; };
}

if (window.location.pathname === "/reset-password") recoveryPage();
else new MutationObserver(addRecoveryButton).observe(document.documentElement, { childList: true, subtree: true });
