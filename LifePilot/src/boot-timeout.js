// Final startup watchdog. This runs independently of React/Supabase so a
// browser-side Auth hang can never leave LifePilot on an infinite loader.
const STARTUP_TIMEOUT = 4000

function showStartupFailure() {
  const root = document.getElementById('root')
  if (!root) return
  const text = (root.textContent || '').trim().toLowerCase()
  const hasInteractive = !!root.querySelector('form,button,input,a[href]')
  if (!text.includes('caricamento') || hasInteractive) return

  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f3ff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#171525">
      <section style="width:min(430px,100%);background:#fff;border:1px solid #e7e2f5;border-radius:24px;padding:28px;box-shadow:0 18px 60px #00000012;text-align:center">
        <div style="width:54px;height:54px;border-radius:16px;background:#6c5ce7;color:#fff;display:grid;place-items:center;margin:0 auto 18px;font-size:28px">✦</div>
        <h1 style="font-size:26px;margin:0 0 10px">LifePilot non si è avviato</h1>
        <p style="color:#706d7c;line-height:1.5;margin:0 0 22px">L'avvio dell'autenticazione non ha risposto. I tuoi dati non sono stati cancellati.</p>
        <button id="lifepilot-hard-retry" style="width:100%;border:0;border-radius:14px;padding:14px 16px;background:#6c5ce7;color:#fff;font:800 16px system-ui;cursor:pointer">Riprova</button>
      </section>
    </main>`

  document.getElementById('lifepilot-hard-retry')?.addEventListener('click', () => {
    window.location.reload()
  })
}

setTimeout(showStartupFailure, STARTUP_TIMEOUT)
setInterval(showStartupFailure, STARTUP_TIMEOUT)
