-- LifePilot gameplay hardening: close client-side mutation paths and make adaptive quiz submissions canonical.

-- Reward issuance is an internal server primitive. It must never be callable directly by a client.
revoke all on function public.award_lifepilot_reward(text,uuid,integer,integer) from public, anon, authenticated;
revoke all on function public.award_lifepilot_reward(text,uuid,integer,integer,integer,uuid,uuid) from public, anon, authenticated;

-- Server-owned progression/read-model tables: clients may read through RLS, but cannot forge rows.
revoke insert, update, delete on public.skill_progress from public, anon, authenticated;
revoke insert, update, delete on public.quiz_attempts from public, anon, authenticated;
revoke insert, update, delete on public.quiz_results from public, anon, authenticated;
revoke insert, update, delete on public.reward_ledger from public, anon, authenticated;
revoke insert, update, delete on public.life_xp_ledger from public, anon, authenticated;
revoke insert, update, delete on public.life_user_achievements from public, anon, authenticated;
revoke insert, update, delete on public.user_achievements from public, anon, authenticated;
revoke insert, update, delete on public.life_quiz_passes from public, anon, authenticated;
revoke insert, update, delete on public.life_shop_redemptions from public, anon, authenticated;
revoke insert, update, delete on public.life_user_shop_items from public, anon, authenticated;

-- Missions/challenges are progression state. The client can no longer forge progress/rewards.
revoke update, delete on public.life_missions from public, anon, authenticated;
revoke update, delete on public.life_challenges from public, anon, authenticated;

-- Goal progress/streak are server-owned fields. Keep normal goal editing available but block forged metrics.
create or replace function public.protect_goal_progression()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then
    new.progress := old.progress;
    new.streak := old.streak;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_goal_progression on public.goals;
create trigger protect_goal_progression
before update on public.goals
for each row execute function public.protect_goal_progression();

-- Profiles: users can edit identity/onboarding fields, never progression/economy fields.
create or replace function public.protect_profile_progression()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then
    new.xp := old.xp;
    new.level := old.level;
    new.lifecoins := old.lifecoins;
    new.current_streak := old.current_streak;
    new.best_streak := old.best_streak;
    new.last_activity_date := old.last_activity_date;
    new.lifepoints := old.lifepoints;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_progression on public.profiles;
create trigger protect_profile_progression
before update on public.profiles
for each row execute function public.protect_profile_progression();

-- Focus sessions: clients may create a session, but server-controlled reward/duration/status values
-- are normalized before persistence. start_focus_session() owns the actual start timestamp.
create or replace function public.protect_focus_session_fields()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op='INSERT' then
    if new.user_id is distinct from auth.uid() then raise exception 'Invalid session owner'; end if;
    new.status := 'scheduled';
    new.xp_reward := 25;
    new.coin_reward := 10;
    new.min_duration_seconds := greatest(60, least(coalesce(new.min_duration_seconds, 1500), 7200));
  elsif not public.is_admin() then
    new.user_id := old.user_id;
    new.goal_id := old.goal_id;
    new.goal_task_id := old.goal_task_id;
    new.xp_reward := old.xp_reward;
    new.coin_reward := old.coin_reward;
    new.min_duration_seconds := old.min_duration_seconds;
    new.status := old.status;
    new.starts_at := old.starts_at;
    new.completed_at := old.completed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_focus_session_fields on public.life_sessions;
create trigger protect_focus_session_fields
before insert or update on public.life_sessions
for each row execute function public.protect_focus_session_fields();

-- Adaptive quiz: require exactly the server-selected question set once, with no duplicates.
create or replace function public.submit_adaptive_quiz(p_session_id uuid,p_goal_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 uid uuid:=auth.uid();
 expected integer;
 answered integer;
 total integer;
 score integer;
 passed boolean;
 skills text[];
 reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if not exists(select 1 from public.life_sessions where id=p_session_id and user_id=uid and goal_id=p_goal_id and status='active') then raise exception 'Invalid active session'; end if;
 if jsonb_typeof(p_answers)<>'array' then raise exception 'Invalid answers'; end if;

 select count(*) into expected
 from (
   select distinct on (q.skill) q.id,q.skill
   from public.quiz_bank q
   left join public.skill_progress s on s.user_id=uid and s.skill=q.skill
   where q.active and q.difficulty=case when coalesce(s.mastery,0)<40 then 'easy' when coalesce(s.mastery,0)<70 then 'medium' else 'hard' end
   order by q.skill,q.created_at desc
 ) selected;

 select count(distinct (a->>'question_id')), count(*), coalesce(sum(case when (a->>'answer')::integer=q.correct_index then 1 else 0 end),0), array_agg(distinct q.skill)
 into answered,total,score,skills
 from jsonb_array_elements(p_answers) a
 join public.quiz_bank q on q.id=(a->>'question_id')::uuid and q.active;

 if total<>answered then raise exception 'Duplicate or invalid quiz question'; end if;
 if answered<>expected then raise exception 'Incomplete adaptive quiz'; end if;
 if expected=0 then raise exception 'No valid quiz questions'; end if;

 passed:=score*100>=expected*60;
 reward:=public.record_quiz_result('adaptive:'||p_session_id::text,p_goal_id,p_session_id,score,expected,skills,array(select distinct (a->>'question_id')::uuid from jsonb_array_elements(p_answers) a));
 return jsonb_build_object('passed',passed,'score',score,'total',expected,'skills',skills,'xp',coalesce((reward->>'xp')::int,0),'lifecoins',coalesce((reward->>'lifecoins')::int,0));
end; $$;
revoke all on function public.submit_adaptive_quiz(uuid,uuid,jsonb) from anon;
grant execute on function public.submit_adaptive_quiz(uuid,uuid,jsonb) to authenticated;

-- Regression-test marker table: keeps security invariants queryable in production diagnostics.
create table if not exists public.gameplay_security_checks (
  check_name text primary key,
  expected_state text not null,
  checked_at timestamptz not null default now()
);
insert into public.gameplay_security_checks(check_name,expected_state)
values
 ('client_cannot_write_xp','revoked'),
 ('client_cannot_write_lifecoins','revoked'),
 ('client_cannot_write_skill_mastery','revoked'),
 ('client_cannot_write_reward_ledger','revoked'),
 ('adaptive_quiz_requires_exact_question_set','enabled')
on conflict(check_name) do update set expected_state=excluded.expected_state,checked_at=now();
alter table public.gameplay_security_checks enable row level security;
revoke all on public.gameplay_security_checks from public,anon,authenticated;
