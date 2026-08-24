(() => {
  const getClient = () => window.__lifepilotSupabase;

  function addForgotPasswordButton() {
    if (location.pathname === '/reset-password') return;
    const forms = document.querySelectorAll('form.form');
    forms.forEach(form => {
      if (form.querySelector('[data-lifepilot-forgot]')) return;
      const password = form.querySelector('input[type="password"]');
      const email = form.querySelector('input[type="email"]');
      if (!password || !email) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lifepilotForgot = 'true';
      button.textContent = 'Password dimenticata? Recuperala';
      button.style.cssText = 'display:block;width:100%;margin:-4px 0 10px;background:none;border:0;padding:6px 0;color:#6c5ce7;font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:right;';
      button.addEventListener('click', async () => {
        const client = getClient();
        const address = email.value.trim().toLowerCase();
        if (!client) return alert('Connessione a LifePilot non disponibile.');
        if (!address) return alert('Inserisci prima la tua email.');
        button.disabled = true;
        try {
          const { error } = await client.auth.resetPasswordForEmail(address, {
            redirectTo: `${location.origin}/reset-password`,
          });
          if (error) throw error;
          alert('Ti abbiamo inviato il link per reimpostare la password. Controlla la posta.');
        } catch (error) {
          alert(error?.message || 'Impossibile inviare il link di recupero.');
        } finally {
          button.disabled = false;
        }
      });
      password.parentElement?.insertAdjacentElement('afterend', button);
    });
  }

  async function renderResetPage() {
    if (location.pathname !== '/reset-password') return;
    const client = getClient();
    if (!client) return;
    const root = document.getElementById('root');
    if (!root) return;

    // Wait briefly for Supabase to consume the recovery hash/session.
    let session = null;
    for (let i = 0; i < 30 && !session; i += 1) {
      const result = await client.auth.getSession();
      session = result?.data?.session || null;
      if (!session) await new Promise(r => setTimeout(r, 150));
    }
    if (!session) return;

    root.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f7f7fb;font-family:Inter,system-ui,sans-serif">
        <div style="width:min(430px,100%);background:white;border:1px solid #e7e7ef;border-radius:24px;padding:30px;box-shadow:0 18px 50px rgba(20,20,40,.08)">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;color:#6c5ce7">LIFEPILOT</div>
          <h1 style="margin:8px 0">Nuova password</h1>
          <p style="color:#6b7280">Scegli una nuova password per il tuo account.</p>
          <form id="lifepilot-reset-form" style="display:grid;gap:14px">
            <label style="display:grid;gap:7px;font-weight:700">Nuova password<input id="lifepilot-new-password" type="password" minlength="6" required autocomplete="new-password" style="padding:12px;border:1px solid #ddd;border-radius:12px;font-size:16px"></label>
            <label style="display:grid;gap:7px;font-weight:700">Conferma password<input id="lifepilot-confirm-password" type="password" minlength="6" required autocomplete="new-password" style="padding:12px;border:1px solid #ddd;border-radius:12px;font-size:16px"></label>
            <div id="lifepilot-reset-message" style="font-size:14px"></div>
            <button style="padding:13px;border:0;border-radius:12px;background:#6c5ce7;color:white;font-weight:800;font-size:15px;cursor:pointer">Salva nuova password</button>
          </form>
        </div>
      </div>`;

    document.getElementById('lifepilot-reset-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const first = document.getElementById('lifepilot-new-password').value;
      const second = document.getElementById('lifepilot-confirm-password').value;
      const message = document.getElementById('lifepilot-reset-message');
      if (first.length < 6) { message.textContent = 'La password deve contenere almeno 6 caratteri.'; return; }
      if (first !== second) { message.textContent = 'Le password non coincidono.'; return; }
      const { error } = await client.auth.updateUser({ password: first });
      if (error) { message.textContent = error.message; return; }
      await client.auth.signOut({ scope: 'local' });
      message.textContent = 'Password aggiornata. Reindirizzamento...';
      setTimeout(() => { location.href = '/'; }, 800);
    });
  }

  const observer = new MutationObserver(addForgotPasswordButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', () => { addForgotPasswordButton(); renderResetPage(); });
  setTimeout(() => { addForgotPasswordButton(); renderResetPage(); }, 500);
})();
