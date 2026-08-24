import { supabase } from '../lib/supabase'

export function subscribeToLifePilotRealtime({ userId, onContent, onUserData, onNotification } = {}) {
  if (!supabase) return () => {}
  const channel = supabase.channel(`lifepilot-live-${userId || 'public'}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, onContent || (() => {}))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, onContent || (() => {}))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', ...(userId ? { filter: `id=eq.${userId}` } : {}) }, onUserData || (() => {}))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, onUserData || (() => {}))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_tasks', ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, onUserData || (() => {}))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, onNotification || (() => {}))
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export async function fetchLiveContent() {
  if (!supabase) return { events: [], announcements: [] }
  const [{ data: events }, { data: announcements }] = await Promise.all([
    supabase.from('events').select('*').eq('published', true).order('starts_at', { ascending: true }),
    supabase.from('announcements').select('*').eq('published', true).order('created_at', { ascending: false }),
  ])
  return { events: events || [], announcements: announcements || [] }
}
