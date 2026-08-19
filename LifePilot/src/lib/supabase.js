import { createClient } from '@supabase/supabase-js'

// LifePilot is permanently bound to its own Supabase project.
// The browser may use only the public publishable key; never expose a secret key.
const url = 'https://rhafdhwixhqxufylavag.supabase.co'
const publishableKey = 'sb_publishable_vUZLRreqEV5FBBN0-y-vww_hvLmloA0'

export const supabaseEnabled = Boolean(url && publishableKey)

let client = null

if (supabaseEnabled) {
  try {
    client = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  } catch (error) {
    // Never let a client-side Supabase initialization failure produce a blank page.
    // App.jsx will render its configuration/error screen instead.
    console.error('[LifePilot] Supabase initialization failed:', error)
    client = null
  }
}

export const supabase = client
export const supabaseReady = Boolean(supabase)

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
