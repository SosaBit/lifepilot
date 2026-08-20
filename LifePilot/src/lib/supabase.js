import { createClient } from '@supabase/supabase-js'

// LifePilot uses only its own Supabase project and a browser-safe public key.
const url = 'https://rhafdhwixhqxufylavag.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYWZkaHdpeGhxeHVmeWxhdmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNzExMDgsImV4cCI6MjEwMjY0NzEwOH0.zi9gsBitbVnt3ni8Jgqy0eK77r5QDekIY3HU3wC8TfE'

let client = null

try {
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
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
  const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth)
  const originalSignUp = supabase.auth.signUp.bind(supabase.auth)

  // Auth bootstrap must NEVER reject or remain pending forever: App.jsx waits
  // for getSession() before it can leave the loading screen. A stale refresh
  // token, broken PKCE state, offline browser, or transient Auth error must
  // therefore degrade to "no session" rather than deadlock the UI.
  supabase.auth.getSession = async (...args) => {
    const timeout = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('[LifePilot] Supabase getSession timed out; starting without a session')
        resolve({ data: { session: null }, error: new Error('Auth session timeout') })
      }, 5000)
    })

    try {
      return await Promise.race([
        originalGetSession(...args),
        timeout,
      ])
    } catch (error) {
      console.warn('[LifePilot] Supabase getSession failed; starting without a session', error)
      return { data: { session: null }, error }
    }
  }

  // Always keep OAuth inside the current LifePilot deployment and preserve
  // the explicit account selector for Google.
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
