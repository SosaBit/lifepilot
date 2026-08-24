import { supabase } from './lib/supabase';

const TRACKABLE = new Set([
  'signup','login','onboarding_completed','goal_created','task_completed',
  'focus_started','focus_completed','pro_checkout_started',
  'pro_checkout_completed','subscription_canceled'
]);

let sessionUserId = null;

export async function track(event_name, extra = {}) {
  if (!TRACKABLE.has(event_name)) return;
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id || sessionUserId || null;
    await supabase.from('analytics_events').insert({
      event_name,
      user_id: userId,
      path: typeof window !== 'undefined' ? window.location.pathname : null,
    });
  } catch {
    // Analytics must never block or break the product.
  }
}

export function startAnalytics() {
  if (typeof window === 'undefined') return () => {};
  const onPage = () => {
    // Page navigation is intentionally not persisted as an analytics event;
    // product analytics only records the allowlisted business events above.
  };
  window.addEventListener('popstate', onPage);
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    sessionUserId = session?.user?.id || null;
    if (event === 'SIGNED_IN') track('login');
  });
  return () => {
    window.removeEventListener('popstate', onPage);
    data.subscription.unsubscribe();
  };
}
