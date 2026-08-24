import { supabase } from '../lib/supabase'

async function getAccessToken() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session?.access_token || null
}

export async function generatePlan(payload) {
  const token = await getAccessToken()

  const response = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Impossibile generare il piano.')
  }

  return data
}

export async function createCheckout(plan) {
  const token = await getAccessToken()
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      plan,
      success_url: `${window.location.origin}/?checkout=success`,
      cancel_url: `${window.location.origin}/?checkout=cancelled`,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Checkout non disponibile.')
  }

  return data
}
