import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL

// Never ship an OpenAI/project secret as a browser-side Supabase key.
// If Vercel contains a stale/wrong VITE_SUPABASE_ANON_KEY, use the public
// Supabase publishable key for LifePilot instead.
const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const LIFE_PILOT_PUBLIC_KEY = 'sb_publishable_vUZLRreqEV5FBBN0-y-vww_hvLmloA0'
const anonKey =
  configuredKey && !configuredKey.startsWith('sk-proj-') && !configuredKey.startsWith('sk-')
    ? configuredKey
    : LIFE_PILOT_PUBLIC_KEY

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
// This prevents stale Vercel deployment URLs from breaking Google sign-in.
if (supabase) {
  const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth)

  supabase.auth.signInWithOAuth = (credentials = {}) => {
    const options = credentials.options ?? {}
    const redirectTo =
      typeof window !== 'undefined' ? window.location.origin : options.redirectTo

    return originalSignInWithOAuth({
      ...credentials,
      options: {
        ...options,
        ...(redirectTo ? { redirectTo } : {}),
      },
    })
  }
}
