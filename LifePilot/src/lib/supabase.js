import { createClient } from '@supabase/supabase-js'

// LifePilot uses only its own Supabase project and a browser-safe publishable key.
const url = 'https://rhafdhwixhqxufylavag.supabase.co'
const anonKey = 'sb_publishable_vUZLRreqEV5FBBN0-y-vww_hvLmloA0'

let client = null

try {
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Avoid a stale browser Web Lock preventing the single-page app from starting.
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  })
} catch (error) {
  console.error('[LifePilot] Supabase initialization failed:', error)
}

export const supabase = client
export const supabaseEnabled = Boolean(client)
export const supabaseReady = Boolean(client)

if (supabase) {
  // Never allow Auth startup to keep the entire UI on "Caricamento...".
  const originalGetSession = supabase.auth.getSession.bind(supabase.auth)
  supabase.auth.getSession = async (...args) => {
    let timeoutId
    try {
      return await Promise.race([
        originalGetSession(...args),
        new Promise((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('[LifePilot] Auth session lookup timed out; showing login screen.')
            resolve({ data: { session: null }, error: null })
          }, 1800)
        }),
      ])
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  // Password login uses a bounded direct Auth request. This avoids a browser-side
  // Auth lock/network promise leaving the button stuck on "Attendi..." forever.
  const originalSignInWithPassword = supabase.auth.signInWithPassword.bind(supabase.auth)
  supabase.auth.signInWithPassword = async (credentials = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { data: { user: null, session: null }, error: new Error(payload.error_description || payload.msg || payload.message || 'Accesso non riuscito.') }
      }
      const { data, error } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      })
      if (error) return { data: { user: null, session: null }, error }
      return data
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { data: { user: null, session: null }, error: new Error('Il server di autenticazione non risponde. Controlla la connessione e riprova.') }
      }
      // Keep the standard Supabase implementation as a fallback for transient
      // browser differences, but bound that fallback as well.
      try {
        return await Promise.race([
          originalSignInWithPassword(credentials),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Accesso scaduto. Riprova.')), 5000)),
        ])
      } catch (fallbackError) {
        return { data: { user: null, session: null }, error: fallbackError }
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth)
  const originalSignUp = supabase.auth.signUp.bind(supabase.auth)

  supabase.auth.signInWithOAuth = (credentials = {}) => {
    const options = credentials.options ?? {}
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/callback`
        : options.redirectTo

    return originalSignInWithOAuth({
      ...credentials,
      options: {
        ...options,
        ...(redirectTo ? { redirectTo } : {}),
        queryParams: {
          ...(options.queryParams || {}),
          prompt: 'select_account',
        },
      },
    })
  }

  supabase.auth.signUp = (credentials = {}) => {
    const options = credentials.options ?? {}
    const emailRedirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/callback`
        : options.emailRedirectTo

    return originalSignUp({
      ...credentials,
      options: {
        ...options,
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    })
  }
}
