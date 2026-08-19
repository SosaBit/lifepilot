import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL

// Browser-safe Supabase publishable key for LifePilot.
// Never read or embed service-role, OpenAI, or other secret keys in the frontend.
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

// Keep OAuth callbacks on the site that actually launched the login.
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
      },
    })
  }
}
