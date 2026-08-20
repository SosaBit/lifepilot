import { supabase } from './lib/supabase'
import { fetchLiveContent, subscribeToLifePilotRealtime } from './services/realtime'

const STYLE_ID = 'lifepilot-live-content-style'
const ROOT_ID = 'lifepilot-live-content'

const esc = (value = '') => String(value).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))
const fmtDate = value => value ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''

function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `#${ROOT_ID}{position:fixed;right:16px;bottom:92px;z-index:1000;font-family:Inter,system-ui,sans-serif}#${ROOT_ID} .lp-live-btn{width:48px;height:48px;border:1px solid #ddd6fe;border-radius:16px;background:#fff;color:#6c5ce7;box-shadow:0 10px 30px #0002;font-weight:800;display:grid;place-items:center}#${ROOT_ID} .lp-live-panel{position:absolute;right:0;bottom:58px;width:min(390px,calc(100vw - 32px));max-height:min(620px,75vh);overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:20px;box-shadow:0 20px 60px #0003;padding:16px;color:#171717}#${ROOT_ID} h3{margin:0 0 4px;font-size:18px}#${ROOT_ID} .lp-muted{color:#6b7280;font-size:13px}#${ROOT_ID} .lp-item{padding:13px 0;border-bottom:1px solid #eee}#${ROOT_ID} .lp-item:last-child{border-bottom:0}#${ROOT_ID} .lp-title{font-weight:850;margin-bottom:4px}#${ROOT_ID} .lp-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#f1edff;color:#6c5ce7;font-size:11px;font-weight:800;margin-bottom:7px}#${ROOT_ID} .lp-admin{margin-top:14px;padding-top:14px;border-top:1px solid #eee}#${ROOT_ID} .lp-admin button,#${ROOT_ID} .lp-admin input,#${ROOT_ID} .lp-admin textarea,#${ROOT_ID} .lp-admin select{width:100%;box-sizing:border-box;margin-top:7px;border:1px solid #ddd6fe;border-radius:10px;padding:10px;font:inherit}#${ROOT_ID} .lp-admin button{background:#6c5ce7;color:#fff;border:0;font-weight:800}#${ROOT_ID} .lp-danger{background:#fee2e2!important;color:#991b1b!important}#${ROOT_ID} .lp-row{display:flex;gap:8px}#${ROOT_ID} .lp-row>*{flex:1}@media(max-width:600px){#${ROOT_ID}{right:12px;bottom:86px}.lp-live-panel{width:calc(100vw - 24px)}}`
  document.head.appendChild(style)
}

async function getUser() {
  if (!supabase) return { user: null, isAdmin: false }
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user || null
  if (!user) return { user: null, isAdmin: false }
  const { data: profile } = await supabase.from('profiles').select('role,nickname').eq('id', user.id).maybeSingle()
  return { user, isAdmin: profile?.role === 'admin' }
}

async function renderContent(container, content, isAdmin) {
  const events = content.events || []
  const announcements = content.announcements || []
  const items = [
    ...announcements.map(a => ({ type: 'Annuncio', date: a.created_at, title: a.title, body: a.body, level: a.level })),
    ...events.map(e => ({ type: 'Evento', date: e.starts_at, title: e.title, body: `${e.description}${e.location ? ` • ${e.location}` : ''}`, level: 'info' })),
  ].sort((a,b) => new Date(b.date) - new Date(a.date))

  const { user } = await getUser()
  let notifications = []
  if (user) {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).is('read_at', null).order('created_at', { ascending: false }).limit(10)
    notifications = data || []
  }

  container.innerHTML = `<button class="lp-live-btn" aria-label="Novità e notifiche">🔔${notifications.length ? `<span style="position:absolute;margin:-34px 0 0 28px;background:#ef4444;color:#fff;border-radius:99px;padding:2px 5px;font-size:10px">${notifications.length}</span>` : ''}</button><div class="lp-live-panel" hidden><h3>Novità LifePilot</h3><div class="lp-muted">Aggiornato in tempo reale</div>${notifications.length ? `<div class="lp-item"><div class="lp-pill">Notifiche</div>${notifications.map(n => `<div style="margin:8px 0"><div class="lp-title">${esc(n.title)}</div><div>${esc(n.body)}</div></div>`).join('')}<button id="lp-read-all" style="margin-top:7px">Segna come lette</button></div>` : ''}${items.length ? items.slice(0,12).map(i => `<div class="lp-item"><div class="lp-pill">${esc(i.type)}</div><div class="lp-title">${esc(i.title)}</div><div>${esc(i.body)}</div><div class="lp-muted" style="margin-top:5px">${fmtDate(i.date)}</div></div>`).join('') : `<div class="lp-item lp-muted">Nessuna novità pubblicata.</div>`}${isAdmin ? `<div class="lp-admin"><div class="lp-title">Gestione contenuti</div><div class="lp-muted">Solo amministratori</div><button id="lp-admin-open">Apri pannello amministratore</button></div>` : ''}</div>`

  const btn = container.querySelector('.lp-live-btn')
  const panel = container.querySelector('.lp-live-panel')
  btn.onclick = () => { panel.hidden = !panel.hidden }
  container.querySelector('#lp-read-all')?.addEventListener('click', async () => {
    if (!user) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
    await refresh()
  })
  container.querySelector('#lp-admin-open')?.addEventListener('click', () => openAdmin(container))
}

async function refresh() {
  const root = document.getElementById(ROOT_ID)
  if (!root) return
  const content = await fetchLiveContent()
  const { isAdmin } = await getUser()
  await renderContent(root, content, isAdmin)
}

async function openAdmin(container) {
  const { isAdmin } = await getUser()
  if (!isAdmin) return
  const panel = container.querySelector('.lp-live-panel')
  panel.hidden = false
  panel.innerHTML = `<h3>Pannello amministratore</h3><div class="lp-muted">Eventi, annunci e notifiche vengono pubblicati senza modificare il codice.</div><div class="lp-admin"><div class="lp-title">Nuovo annuncio</div><input id="lp-a-title" placeholder="Titolo"><textarea id="lp-a-body" placeholder="Testo"></textarea><select id="lp-a-level"><option value="info">Info</option><option value="success">Successo</option><option value="warning">Avviso</option><option value="urgent">Urgente</option></select><button id="lp-a-save">Pubblica annuncio</button></div><div class="lp-admin"><div class="lp-title">Nuovo evento</div><input id="lp-e-title" placeholder="Titolo"><textarea id="lp-e-body" placeholder="Descrizione"></textarea><input id="lp-e-date" type="datetime-local"><input id="lp-e-location" placeholder="Luogo"><button id="lp-e-save">Pubblica evento</button></div><div class="lp-admin"><div class="lp-title">Notifica globale</div><input id="lp-n-title" placeholder="Titolo"><textarea id="lp-n-body" placeholder="Messaggio"></textarea><button id="lp-n-save">Invia a tutti gli utenti</button></div><div class="lp-admin"><button id="lp-admin-close" class="lp-danger">Chiudi pannello</button></div>`

  panel.querySelector('#lp-a-save').onclick = async () => {
    const title = panel.querySelector('#lp-a-title').value.trim(), body = panel.querySelector('#lp-a-body').value.trim()
    if (!title || !body) return alert('Inserisci titolo e testo.')
    const { error } = await supabase.from('announcements').insert({ title, body, level: panel.querySelector('#lp-a-level').value, published: true })
    if (error) return alert(error.message)
    await refresh()
  }
  panel.querySelector('#lp-e-save').onclick = async () => {
    const title = panel.querySelector('#lp-e-title').value.trim(), description = panel.querySelector('#lp-e-body').value.trim(), starts = panel.querySelector('#lp-e-date').value
    if (!title || !starts) return alert('Inserisci titolo e data.')
    const { error } = await supabase.from('events').insert({ title, description, starts_at: new Date(starts).toISOString(), location: panel.querySelector('#lp-e-location').value.trim(), published: true })
    if (error) return alert(error.message)
    await refresh()
  }
  panel.querySelector('#lp-n-save').onclick = async () => {
    const title = panel.querySelector('#lp-n-title').value.trim(), body = panel.querySelector('#lp-n-body').value.trim()
    if (!title) return alert('Inserisci un titolo.')
    const { data: users, error } = await supabase.from('profiles').select('id')
    if (error) return alert(error.message)
    const { error: insertError } = await supabase.from('notifications').insert((users || []).map(u => ({ user_id: u.id, title, body })))
    if (insertError) return alert(insertError.message)
    await refresh()
  }
  panel.querySelector('#lp-admin-close').onclick = refresh
}

async function boot() {
  if (!supabase || document.getElementById(ROOT_ID)) return
  installStyles()
  const root = document.createElement('div')
  root.id = ROOT_ID
  document.body.appendChild(root)
  await refresh()

  let timer
  const schedule = () => { clearTimeout(timer); timer = setTimeout(refresh, 250) }
  const unsubscribe = subscribeToLifePilotRealtime({ onContent: schedule, onNotification: schedule })
  window.addEventListener('beforeunload', unsubscribe, { once: true })

  supabase.auth.onAuthStateChange(() => schedule())
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
else boot()
