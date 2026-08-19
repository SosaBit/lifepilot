import { createClient } from '@supabase/supabase-js'

// LifePilot is permanently bound to its own Supabase project.
// Use the project's modern publishable key; never read Vercel secrets in the browser.
const url = 'https://rhafdhwixhqxufylavag.supabase.co'
const publishableKey = 'sb_publishable_vUZLRreqEV5FBBN0-y-vww_hvLmloA0'

export const supabaseEnabled = Boolean(url && publishableKey)

export const supabase = supabaseEnabled
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
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
