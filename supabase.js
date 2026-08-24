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

  const originalFunctionsInvoke = supabase.functions.invoke.bind(supabase.functions)

  // Edge Function transport wrapper. For every transport/non-2xx error we
  // refresh the session and make one direct request so the real HTTP status
  // and response body are not hidden behind the generic supabase-js message.
  supabase.functions.invoke = async (functionName, options = {}) => {
    const invokeOnce = async () => originalFunctionsInvoke(functionName, options)
    let first = await invokeOnce()
    if (!first?.error) return first

    const firstMessage = String(first.error?.message || '')
    const shouldRetry = /failed to send a request|edge function returned a non-2xx|non-2xx|jwt|token|unauthorized|401|network|fetch/i.test(firstMessage)
    if (!shouldRetry) return first

    try {
      const refreshed = await supabase.auth.refreshSession()
      if (refreshed?.data?.session) {
        first = await invokeOnce()
        if (!first?.error) return first
      }
    } catch (refreshError) {
      console.warn('[LifePilot] Edge Function session refresh failed:', refreshError)
    }

    const sessionResult = await originalGetSession()
    const accessToken = sessionResult?.data?.session?.access_token
    if (!accessToken || typeof window === 'undefined') return first

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      const response = await fetch(`${url}/functions/v1/${functionName}`, {
        method: options.method || 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body === undefined
          ? undefined
          : typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const text = await response.text()
      let data = null
      try { data = text ? JSON.parse(text) : null } catch { data = text }
      if (!response.ok) {
        const message = data?.error || data?.message || data?.msg || `Edge Function ${functionName} ha risposto HTTP ${response.status}.`
        console.error(`[LifePilot] ${functionName} HTTP ${response.status}:`, data)
        return { data, error: new Error(message), response }
      }
      return { data, error: null, response }
    } catch (fallbackError) {
      console.error('[LifePilot] Edge Function fallback failed:', fallbackError)
      return {
        data: null,
        error: new Error(
          fallbackError?.name === 'AbortError'
            ? 'La generazione AI sta impiegando troppo tempo. Riprova.'
            : 'Impossibile raggiungere il servizio AI. Controlla la connessione e riprova.',
        ),
      }
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
