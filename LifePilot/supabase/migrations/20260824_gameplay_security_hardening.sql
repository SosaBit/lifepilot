-- Gameplay RPCs are authenticated-only; security-definer functions must not be callable anonymously.
revoke execute on function public.complete_focus_session(uuid) from public,anon;
revoke execute on function public.complete_life_session(uuid) from public,anon;
revoke execute on function public.complete_lifepilot_challenge(uuid,integer) from public,anon;
revoke execute on function public.evaluate_progression() from public,anon;
revoke execute on function public.get_life_session_quiz(uuid) from public,anon;
revoke execute on function public.grant_quiz_achievements() from public,anon;
revoke execute on function public.purchase_lifecoin_item(uuid) from public,anon;
revoke execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) from public,anon;
revoke execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[],uuid[]) from public,anon;
revoke execute on function public.redeem_lifecoins(uuid) from public,anon;
revoke execute on function public.start_focus_session(uuid) from public,anon;
revoke execute on function public.submit_life_session_quiz(uuid,text) from public,anon;
revoke execute on function public.update_streak_from_activity() from public,anon;
revoke execute on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated;

-- The quiz bank contains answer keys and must never be exposed through PostgREST.
alter table public.quiz_bank enable row level security;
revoke all on table public.quiz_bank from anon,authenticated;
