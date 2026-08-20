// LifePilot boot recovery: prevents a stale/blocked Supabase session from leaving
// the mobile app permanently on the "Caricamento..." screen.
const startedAt = Date.now()
const RECOVERY_KEY = 'lifepilot_boot_recovery_v1'

function isStuckOnLoading() {
  const root = document.getElementById('root')
  if (!root) return false
  const text = (root.textContent || '').trim().toLowerCase()
  return text.includes('caricamento') && !root.querySelector('form,button,input,a[href]')
}

function clearAuthCache() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') || key.startsWith('supabase.') || key.startsWith('lifepilot_')) {
        localStorage.removeItem(key)
      }
    }
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('sb-') || key.startsWith('supabase.') || key.startsWith('lifepilot_')) {
        sessionStorage.removeItem(key)
      }
    }
  } catch (error) {
    console.warn('[LifePilot] boot recovery storage cleanup failed', error)
  }
}

function recover() {
  if (!isStuckOnLoading()) return
  if (sessionStorage.getItem(RECOVERY_KEY) !== '1') {
    sessionStorage.setItem(RECOVERY_KEY, '1')
    clearAuthCache()
    window.location.reload()
    return
  }

  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f3ff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#171525">
      <section style="width:min(430px,100%);background:#fff;border:1px solid #e7e2f5;border-radius:24px;padding:28px;box-shadow:0 18px 60px #00000012;text-align:center">
        <div style="width:54px;height:54px;border-radius:16px;background:#6c5ce7;color:#fff;display:grid;place-items:center;margin:0 auto 18px;font-size:28px">✦</div>
        <h1 style="font-size:26px;margin:0 0 10px">LifePilot non si è avviato</h1>
        <p style="color:#706d7c;line-height:1.5;margin:0 0 22px">La sessione precedente è stata ripristinata. Tocca il pulsante per riprovare.</p>
        <button id="lifepilot-retry" style="width:100%;border:0;border-radius:14px;padding:14px 16px;background:#6c5ce7;color:#fff;font:800 16px system-ui;cursor:pointer">Riprova</button>
      </section>
    </main>`
  document.getElementById('lifepilot-retry')?.addEventListener('click', () => {
    sessionStorage.removeItem(RECOVERY_KEY)
    clearAuthCache()
    window.location.reload()
  })
}

setTimeout(() => {
  if (Date.now() - startedAt >= 7000) recover()
}, 7000)
