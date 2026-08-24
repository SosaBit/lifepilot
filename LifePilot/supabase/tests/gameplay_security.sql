-- Regression suite for gameplay security invariants.
do $$
declare n integer;
begin
 select count(*) into n from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname='public' and c.relname in ('profiles','goals','goal_tasks','life_sessions','life_missions','life_challenges','quiz_attempts','quiz_results','reward_ledger','skill_progress','life_xp_ledger','life_user_achievements','life_shop_redemptions','life_user_shop_items') and c.relrowsecurity;
 if n<>14 then raise exception 'RLS regression: expected 14 gameplay tables protected, got %',n; end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('anon',p.oid,'execute')) then raise exception 'RLS regression: SECURITY DEFINER function callable by anon'; end if;
 if has_table_privilege('authenticated','public.skill_progress','insert') or has_table_privilege('authenticated','public.skill_progress','update') or has_table_privilege('authenticated','public.skill_progress','delete') then raise exception 'Anti-cheat regression: skill_progress writable by client'; end if;
 if has_table_privilege('authenticated','public.reward_ledger','insert') or has_table_privilege('authenticated','public.reward_ledger','update') or has_table_privilege('authenticated','public.reward_ledger','delete') then raise exception 'Anti-cheat regression: reward_ledger writable by client'; end if;
 if has_table_privilege('authenticated','public.life_xp_ledger','insert') or has_table_privilege('authenticated','public.life_xp_ledger','update') or has_table_privilege('authenticated','public.life_xp_ledger','delete') then raise exception 'Anti-cheat regression: XP ledger writable by client'; end if;
 if has_table_privilege('authenticated','public.life_challenges','insert') or has_table_privilege('authenticated','public.life_challenges','update') or has_table_privilege('authenticated','public.life_challenges','delete') then raise exception 'Anti-cheat regression: challenges writable by client'; end if;
 if has_table_privilege('authenticated','public.goal_tasks','update') then raise exception 'Anti-cheat regression: mission completion writable by client'; end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='reward_ledger') then raise exception 'Reward ledger missing'; end if;
 if not exists(select 1 from pg_constraint where conname='life_xp_ledger_user_id_source_type_source_id_key') then raise exception 'XP idempotency constraint missing'; end if;
 if not exists(select 1 from pg_constraint where conname='life_quiz_passes_user_id_session_id_key') then raise exception 'Quiz pass idempotency constraint missing'; end if;
 raise notice 'LifePilot gameplay security regression suite: PASS';
end $$;
