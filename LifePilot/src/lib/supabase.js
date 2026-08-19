import { createClient } from '@supabase/supabase-js'

// LifePilot uses exactly one Supabase project. Keep the public URL and
// publishable key together so a stale/wrong Vercel environment variable
// cannot silently connect the browser to another project.
const url = 'https://rhafdhwixhqxufylavag.supabase.co'
const anonKey = 'sb_publishable_vUZLRreqEV5FBBN0-y-vww_hvLmloA0'

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

  // Allows the small password-recovery bridge to use the same configured client.
  if (typeof window !== 'undefined') window.__lifepilotSupabase = supabase
}
