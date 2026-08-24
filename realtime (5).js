import { supabase } from './supabase'

// Centralized Realtime helper. Components can subscribe to database changes without
// knowing channel names or lifecycle details. A failed Realtime connection must
// never block the app; REST remains the source of truth/fallback.
export function subscribeToTable({ table, filter, onChange, event = '*' }) {
  if (!supabase || typeof onChange !== 'function') return () => {}

  const channelName = `lifepilot:${table}:${filter || 'all'}:${Math.random().toString(36).slice(2)}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event, schema: 'public', table, ...(filter ? { filter } : {}) },
      (payload) => {
        try {
          onChange(payload)
        } catch (error) {
          console.error(`[LifePilot] Realtime ${table} handler failed`, error)
        }
      },
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[LifePilot] Realtime ${table} unavailable; REST fallback remains active`, error)
      }
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToUserData(userId, handlers = {}) {
  if (!userId) return () => {}

  const unsubscribers = [
    subscribeToTable({
      table: 'profiles',
      filter: `id=eq.${userId}`,
      onChange: handlers.onProfileChange,
    }),
    subscribeToTable({
      table: 'goals',
      filter: `user_id=eq.${userId}`,
      onChange: handlers.onGoalChange,
    }),
  ]

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
}
