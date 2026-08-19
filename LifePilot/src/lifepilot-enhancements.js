import { supabase, supabaseEnabled } from './lib/supabase'

const THEMES = {
  violet: { name: 'Violet', primary: '#6c5ce7', dark: '#5546d6', soft: '#efedff' },
  blue: { name: 'Oceano', primary: '#2878d7', dark: '#1d5fae', soft: '#eaf3ff' },
  green: { name: 'Smeraldo', primary: '#159a70', dark: '#0e7957', soft: '#e8f8f2' },
  orange: { name: 'Ambra', primary: '#e58a1f', dark: '#bc6d0e', soft: '#fff4e4' },
  pink: { name: 'Rosa', primary: '#d94f87', dark: '#b83b6e', soft: '#fff0f6' },
  dark: { name: 'Notte', primary: '#8b7cff', dark: '#7566ed', soft: '#292644' },
}

let mounted = false
let overlay = null

function applyTheme(key) {
  const theme = THEMES[key] || THEMES.violet
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--primary-dark', theme.dark)
  root.style.setProperty('--primary-soft', theme.soft)
  root.dataset.theme = key
  if (key === 'dark') {
    root.style.setProperty('--bg', '#11131a')
    root.style.setProperty('--surface', '#191c25')
    root.style.setProperty('--surface-soft', '#222633')
    root.style.setProperty('--border', '#303644')
    root.style.setProperty('--border-strong', '#424a5b')
    root.style.setProperty('--text', '#f4f6fb')
    root.style.setProperty('--text-soft', '#b5bdcc')
    root.style.setProperty('--text-muted', '#8993a6')
    document.body.classList.add('lp-dark')
  } else {
    root.style.setProperty('--bg', '#f7f9fc')
    root.style.setProperty('--surface', '#ffffff')
    root.style.setProperty('--surface-soft', '#f4f7fb')
    root.style.setProperty('--border', '#e5eaf2')
    root.style.setProperty('--border-strong', '#d8e0eb')
    root.style.setProperty('--text', '#172033')
    root.style.setProperty('--text-soft', '#657085')
    root.style.setProperty('--text-muted', '#8b95a7')
    document.body.classList.remove('lp-dark')
  }
  localStorage.setItem('lifepilot-theme', key)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.primary)
}

function openOverlay(type) {
  if (!overlay) return
  const content = overlay.querySelector('.lp-modal-content')
  if (type === 'settings') content.innerHTML = settingsMarkup()
  if (type === 'ranking') content.innerHTML = rankingMarkup('<div class="lp-loading">Caricamento classifiche…</div>')
  overlay.classList.add('open')
  if (type === 'ranking') loadRanking(content)
}

function closeOverlay() {
  overlay?.classList.remove('open')
}

function settingsMarkup() {
  const current = localStorage.getItem('lifepilot-theme') || 'violet'
  return `<div class="lp-modal-head"><div><span>PERSONALIZZA</span><h2>Impostazioni</h2></div><button data-lp-close aria-label="Chiudi">×</button></div>
    <div class="lp-setting-section"><strong>Tema</strong><p>Scegli il colore di LifePilot. La scelta viene salvata su questo dispositivo.</p>
      <div class="lp-themes">${Object.entries(THEMES).map(([key, t]) => `<button class="lp-theme ${current === key ? 'active' : ''}" data-theme-key="${key}"><i style="background:${t.primary}"></i><span>${t.name}</span></button>`).join('')}</div>
    </div>
    <div class="lp-setting-section"><strong>Esperienza mobile</strong><p>Interfaccia ottimizzata per Android: menu laterale, pulsanti grandi e layout senza overflow.</p><div class="lp-mobile-ok">✓ Ottimizzazione Android attiva</div></div>`
}

function rankingMarkup(body) {
  return `<div class="lp-modal-head"><div><span>PROGRESSI</span><h2>Classifiche</h2></div><button data-lp-close aria-label="Chiudi">×</button></div><p class="lp-ranking-note">Classifica basata sui progressi degli obiettivi e sulla costanza.</p>${body}`
}

async function loadRanking(content) {
  const { data, error } = await supabase.rpc('get_public_leaderboard', { limit_count: 20 })
  if (error) {
    content.querySelector('.lp-ranking-note')?.insertAdjacentHTML('afterend', `<div class="lp-error">Non riesco a caricare la classifica in questo momento.</div>`)
    content.querySelector('.lp-loading')?.remove()
    return
  }
  const current = (await supabase.auth.getUser()).data.user?.id
  const rows = data || []
  const html = rows.length ? rows.map((row) => `<div class="lp-rank-row"><b>#${row.rank}</b><span>${escapeHtml(row.nickname)}</span><strong>${row.score} pt</strong></div>`).join('') : '<div class="lp-empty">Nessun profilo disponibile.</div>'
  content.querySelector('.lp-loading')?.replaceWith(document.createRange().createContextualFragment(`<div class="lp-ranking-list">${html}</div><small class="lp-privacy">Sono mostrati solo nickname e punteggio, mai email o data di nascita.</small>`))
  void current
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]))
}

function ensureStyles() {
  if (document.getElementById('lifepilot-enhancement-styles')) return
  const style = document.createElement('style')
  style.id = 'lifepilot-enhancement-styles'
  style.textContent = `
    .lp-tools{position:fixed;right:18px;bottom:18px;z-index:9998;display:flex;gap:8px;padding:6px;border:1px solid var(--border);border-radius:16px;background:color-mix(in srgb,var(--surface) 92%,transparent);box-shadow:0 14px 38px rgba(20,31,56,.16);backdrop-filter:blur(14px)}
    .lp-tool{width:44px;height:44px;border:0;border-radius:12px;background:var(--surface-soft);color:var(--text);display:grid;place-items:center;cursor:pointer}
    .lp-tool.primary{background:var(--primary);color:#fff}
    .lp-modal-backdrop{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(8,11,18,.48);backdrop-filter:blur(5px)}
    .lp-modal-backdrop.open{display:flex}.lp-modal{width:min(620px,100%);max-height:min(760px,92vh);overflow:auto;border:1px solid var(--border);border-radius:24px;background:var(--surface);color:var(--text);box-shadow:0 30px 90px rgba(0,0,0,.25);padding:24px}.lp-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.lp-modal-head span{font-size:10px;font-weight:900;letter-spacing:.14em;color:var(--text-muted)}.lp-modal-head h2{margin:4px 0 0;font-size:26px}.lp-modal-head button{width:40px;height:40px;border:0;border-radius:12px;background:var(--surface-soft);color:var(--text);font-size:26px;cursor:pointer}.lp-setting-section{margin-top:26px;padding-top:20px;border-top:1px solid var(--border)}.lp-setting-section strong{font-size:15px}.lp-setting-section p,.lp-ranking-note{color:var(--text-soft);font-size:13px;line-height:1.55}.lp-themes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.lp-theme{min-height:70px;border:1px solid var(--border);border-radius:14px;background:var(--surface-soft);color:var(--text);display:flex;align-items:center;gap:10px;padding:10px;cursor:pointer;text-align:left}.lp-theme.active{border:2px solid var(--primary)}.lp-theme i{width:28px;height:28px;border-radius:9px;display:block}.lp-mobile-ok{padding:12px;border-radius:12px;background:var(--primary-soft);color:var(--primary);font-weight:700;font-size:13px}.lp-ranking-list{display:flex;flex-direction:column;gap:8px;margin-top:16px}.lp-rank-row{display:grid;grid-template-columns:52px 1fr auto;align-items:center;gap:10px;padding:13px 14px;border:1px solid var(--border);border-radius:13px;background:var(--surface-soft)}.lp-rank-row b{color:var(--primary)}.lp-rank-row strong{font-size:13px}.lp-privacy{display:block;margin-top:12px;color:var(--text-muted)}.lp-loading,.lp-empty,.lp-error{padding:20px;text-align:center;color:var(--text-soft)}
    .lp-dark .app,.lp-dark .sidebar,.lp-dark .topbar,.lp-dark .mobile-drawer,.lp-dark .auth-card,.lp-dark .profile-setup-card,.lp-dark .modal-card{background:var(--surface);color:var(--text)}
    @media(max-width:760px){.lp-tools{right:12px;bottom:max(12px,env(safe-area-inset-bottom));left:12px;justify-content:center}.lp-tool{flex:1;max-width:58px}.lp-modal{padding:18px;border-radius:20px}.lp-themes{grid-template-columns:repeat(2,1fr)}.app-layout{grid-template-columns:1fr!important}.sidebar{display:none!important}.main-content{width:100%;min-width:0;padding:18px 14px 92px!important}.topbar-inner{width:100%!important;padding:0 14px!important}.page{width:100%!important}.page-header{flex-direction:column!important;align-items:stretch!important;gap:16px}.page-header h1{font-size:32px!important}.dashboard-grid,.quick-grid{grid-template-columns:1fr!important}.goal-panel,.today-panel,.quick-card,.goal-card,.profile-panel,.settings-card{min-width:0!important}.goal-card{flex-direction:column!important;gap:16px}.goal-card-side{width:100%!important;justify-content:space-between}.auth-layout{grid-template-columns:1fr!important;gap:20px!important;width:min(100% - 24px,600px)!important;padding-top:10px!important}.auth-intro{display:none!important}.auth-topbar{width:calc(100% - 28px)!important}.auth-card{padding:22px!important}.profile-setup-card{width:calc(100% - 28px)!important;padding:22px!important}.modal-card{width:calc(100% - 24px)!important}.quick-card{padding:18px!important}}
  `
  document.head.appendChild(style)
}

function mountTools() {
  if (mounted || !document.getElementById('root')) return
  mounted = true
  ensureStyles()
  const saved = localStorage.getItem('lifepilot-theme') || 'violet'
  applyTheme(saved)
  const tools = document.createElement('div')
  tools.className = 'lp-tools'
  tools.innerHTML = `<button class="lp-tool primary" data-lp-ranking title="Classifiche" aria-label="Classifiche">🏆</button><button class="lp-tool" data-lp-settings title="Impostazioni" aria-label="Impostazioni">⚙️</button><button class="lp-tool" data-lp-account title="Cambia account" aria-label="Cambia account">↪</button>`
  document.body.appendChild(tools)
  overlay = document.createElement('div')
  overlay.className = 'lp-modal-backdrop'
  overlay.innerHTML = '<div class="lp-modal" role="dialog" aria-modal="true"><div class="lp-modal-content"></div></div>'
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay() })
  document.body.appendChild(overlay)
  tools.querySelector('[data-lp-ranking]').onclick = () => openOverlay('ranking')
  tools.querySelector('[data-lp-settings]').onclick = () => openOverlay('settings')
  tools.querySelector('[data-lp-account]').onclick = async () => { await supabase.auth.signOut(); location.reload() }
  overlay.addEventListener('click', (e) => {
    const close = e.target.closest('[data-lp-close]')
    if (close) closeOverlay()
    const theme = e.target.closest('[data-theme-key]')
    if (theme) { applyTheme(theme.dataset.themeKey); openOverlay('settings') }
  })
  supabase?.auth.onAuthStateChange((_event, session) => { tools.style.display = session ? 'flex' : 'none' })
  supabase?.auth.getSession().then(({ data }) => { tools.style.display = data.session ? 'flex' : 'none' })
}

if (supabaseEnabled && supabase) {
  window.addEventListener('DOMContentLoaded', mountTools)
  if (document.readyState !== 'loading') mountTools()
}
