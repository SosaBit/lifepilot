import { createClient } from '@supabase/supabase-js'

// LifePilot is bound explicitly to its own Supabase project.
// The legacy anon key is public by design and is supported by every
// supabase-js v2 client used by this project.
const url = 'https://rhafdhwixhqxufylavag.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYWZkaHdpeGhxeHVmeWxhdmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNzExMDgsImV4cCI6MjEwMjY0NzEwOH0.zi9gsBitbVnt3ni8Jgqy0eK77r5QDekIY3HU3wC8TfE'

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

if (supabase) {
  const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth)

  supabase.auth.signInWithOAuth = (credentials = {}) => {
    const options = credentials.options ?? {}
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/callback` : options.redirectTo

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

  if (typeof window !== 'undefined') window.__lifepilotSupabase = supabase
}
