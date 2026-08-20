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
      // Android browsers can retain a stale Web Locks lock after a tab is
      // discarded. That can leave getSession() waiting forever on startup.
      // LifePilot is a single-page browser client, so serialize Auth calls
      // locally instead of relying on navigator.locks across discarded tabs.
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
