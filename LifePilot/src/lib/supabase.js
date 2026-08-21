import { createClient } from '@supabase/supabase-js'

// LifePilot uses only its own Supabase project and a browser-safe public key.
const url = 'https://rhafdhwixhqxufylavag.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJyaGFmZGhid2l4aHF4dWZ5bGF2YWciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NzA3MTEwOCwiZXhwIjoxNzgyNjQ3MTA4fQ.zi9gsBitbVnt3ni8Jgqy0eK77r5QDekIY3HU3wC8TfE'

let client = null

try {
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Android browsers can retain a stale Web Locks lock after a tab is
      // discarded. LifePilot is a single-page browser client, so do not let
      // a stale navigator lock block the whole application at startup.
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
  // A missing session is a valid result: the Auth screen can then be shown,
  // while the real request is allowed to finish in the background.
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

  const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth)
  const originalSignUp = supabase.auth.signUp.bind(supabase.auth)

  // Keep OAuth inside the current LifePilot deployment and preserve the
  // explicit account selector for Google.
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

  // Email confirmation must return to LifePilot as well. This is especially
  // important for PKCE on Android browsers, where the original page can be
  // discarded before the confirmation link is opened.
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
