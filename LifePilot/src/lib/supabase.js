import { createClient } from '@supabase/supabase-js'

// LifePilot uses only its own Supabase project and a browser-safe public key.
// The legacy anon key is intentionally used here for maximum compatibility with
// the installed supabase-js version and Supabase Auth endpoints.
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

// Keep Google account selection explicit and always return to the current LifePilot origin.
if (supabase) {
  const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth)

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
}
