import { supabase, supabaseEnabled } from './lib/supabase'

const STYLE_ID = 'lp-password-recovery-styles'

function addStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .lp-recovery-link{display:block;width:100%;margin:12px 0 0;border:0;background:transparent;color:var(--primary,#6c5ce7);font:inherit;font-weight:800;font-size:13px;text-align:center;cursor:pointer;padding:8px}
    .lp-recovery-overlay{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:18px;background:rgba(8,11,18,.62);backdrop-filter:blur(7px)}
    .lp-recovery-card{width:min(460px,100%);padding:28px;border:1px solid #e5eaf2;border-radius:24px;background:#fff;color:#172033;box-shadow:0 30px 90px rgba(0,0,0,.28)}
    .lp-recovery-card h2{margin:0 0 8px;font-size:28px}.lp-recovery-card p{color:#657085;line-height:1.55;font-size:14px;margin:0 0 20px}
    .lp-recovery-card label{display:grid;gap:7px;font-size:13px;font-weight:800;margin:14px 0}.lp-recovery-card input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #d8e0eb;border-radius:12px;font:inherit;background:#fff;color:#172033}
    .lp-recovery-actions{display:flex;gap:10px;margin-top:18px}.lp-recovery-actions button{flex:1;padding:13px 16px;border:0;border-radius:12px;font:inherit;font-weight:800;cursor:pointer}.lp-recovery-primary{background:#6c5ce7;color:#fff}.lp-recovery-secondary{background:#f4f7fb;color:#172033}.lp-recovery-msg{padding:11px 13px;border-radius:11px;margin-top:12px;background:#f4f7fb;color:#657085;font-size:13px}.lp-recovery-msg.error{background:#fff0f0;color:#b42318}.lp-recovery-msg.success{background:#ecfdf3;color:#087443}
    @media(max-width:560px){.lp-recovery-card{padding:22px;border-radius:20px}.lp-recovery-card h2{font-size:24px}}
  `
  document.head.appendChild(style)
}

function overlay(html) {
  document.querySelector('.lp-recovery-overlay')?.remove()
  const el = document.createElement('div')
  el.className = 'lp-recovery-overlay'
  el.innerHTML = `<div class="lp-recovery-card">${html}</div>`
  document.body.appendChild(el)
  return el
}

function addForgotLink() {
  if (!supabaseEnabled || !supabase || document.querySelector('.lp-recovery-link')) return
  const heading = [...document.querySelectorAll('h2')].find((h) => h.textContent?.trim() === 'Accedi a LifePilot')
  if (!heading) return
  const form = heading.closest('.auth-card')?.querySelector('form.form')
  if (!form) return
  const link = document.createElement('button')
  link.type = 'button'
  link.className = 'lp-recovery-link'
  link.textContent = 'Password dimenticata? Recuperala'
  link.onclick = openRequest
  form.appendChild(link)
}

function openRequest() {
  const email = document.querySelector('.auth-card input[type="email"]')?.value?.trim() || ''
  const el = overlay(`
    <h2>Recupera la password</h2>
    <p>Inserisci l'email del tuo account. Ti invieremo un link per scegliere una nuova password.</p>
    <label>Email<input id="lp-recovery-email" type="email" value="${escapeAttr(email)}" autocomplete="email" placeholder="nome@email.com" required></label>
    <div id="lp-recovery-msg" class="lp-recovery-msg" hidden></div>
    <div class="lp-recovery-actions"><button class="lp-recovery-secondary" type="button" data-close>Indietro</button><button class="lp-recovery-primary" type="button" id="lp-send-reset">Invia link</button></div>
  `)
  el.querySelector('[data-close]').onclick = () => el.remove()
  el.querySelector('#lp-send-reset').onclick = async () => {
    const input = el.querySelector('#lp-recovery-email')
    const msg = el.querySelector('#lp-recovery-msg')
    const value = input.value.trim().toLowerCase()
    if (!value) { msg.hidden = false; msg.className = 'lp-recovery-msg error'; msg.textContent = 'Inserisci un indirizzo email.'; return }
    const button = el.querySelector('#lp-send-reset')
    button.disabled = true; button.textContent = 'Invio...'
    const { error } = await supabase.auth.resetPasswordForEmail(value, { redirectTo: window.location.origin })
    button.disabled = false; button.textContent = 'Invia link'
    msg.hidden = false
    if (error) { msg.className = 'lp-recovery-msg error'; msg.textContent = error.message }
    else { msg.className = 'lp-recovery-msg success'; msg.textContent = 'Se l\'account esiste, abbiamo inviato il link. Controlla la posta e anche Spam.' }
  }
}

function showResetForm() {
  if (!supabaseEnabled || !supabase) return
  const el = overlay(`
    <h2>Imposta una nuova password</h2>
    <p>Scegli una nuova password di almeno 6 caratteri per il tuo account LifePilot.</p>
    <label>Nuova password<input id="lp-new-password" type="password" minlength="6" autocomplete="new-password" required></label>
    <label>Conferma password<input id="lp-confirm-password" type="password" minlength="6" autocomplete="new-password" required></label>
    <div id="lp-reset-msg" class="lp-recovery-msg" hidden></div>
    <div class="lp-recovery-actions"><button class="lp-recovery-primary" type="button" id="lp-save-password">Salva nuova password</button></div>
  `)
  el.querySelector('#lp-save-password').onclick = async () => {
    const password = el.querySelector('#lp-new-password').value
    const confirm = el.querySelector('#lp-confirm-password').value
    const msg = el.querySelector('#lp-reset-msg')
    if (password.length < 6) { msg.hidden = false; msg.className = 'lp-recovery-msg error'; msg.textContent = 'La password deve contenere almeno 6 caratteri.'; return }
    if (password !== confirm) { msg.hidden = false; msg.className = 'lp-recovery-msg error'; msg.textContent = 'Le password non coincidono.'; return }
    const button = el.querySelector('#lp-save-password'); button.disabled = true; button.textContent = 'Salvataggio...'
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { button.disabled = false; button.textContent = 'Salva nuova password'; msg.hidden = false; msg.className = 'lp-recovery-msg error'; msg.textContent = error.message; return }
    await supabase.auth.signOut({ scope: 'local' })
    history.replaceState({}, document.title, window.location.pathname)
    el.innerHTML = `<h2>Password aggiornata</h2><p>La tua password è stata modificata. Ora puoi accedere con la nuova password.</p><div class="lp-recovery-actions"><button class="lp-recovery-primary" id="lp-back-login">Torna ad Accedi</button></div>`
    el.querySelector('#lp-back-login').onclick = () => location.reload()
  }
}

function escapeAttr(value) { return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function isRecoveryUrl() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  return hash.get('type') === 'recovery' || query.get('type') === 'recovery'
}

function init() {
  if (!supabaseEnabled || !supabase) return
  addStyles()
  if (isRecoveryUrl()) { showResetForm(); return }
  const observer = new MutationObserver(addForgotLink)
  observer.observe(document.body, { childList: true, subtree: true })
  addForgotLink()
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init)
else init()
