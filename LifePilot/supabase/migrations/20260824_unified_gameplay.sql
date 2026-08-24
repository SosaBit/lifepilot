-- LifePilot 2.0: canonical gameplay/reward contract
alter table public.profiles add column if not exists lifepoints integer not null default 0;
alter table public.reward_ledger add column if not exists lifepoints integer not null default 0;
alter table public.reward_ledger add column if not exists goal_id uuid references public.goals(id) on delete set null;
alter table public.reward_ledger add column if not exists session_id uuid references public.life_sessions(id) on delete set null;
alter table public.reward_ledger add column if not exists idempotency_key text;
create unique index if not exists reward_ledger_user_idempotency_key_uidx on public.reward_ledger(user_id,idempotency_key) where idempotency_key is not null;
create unique index if not exists reward_ledger_user_source_uidx on public.reward_ledger(user_id,source_type,source_id) where source_id is not null;
alter table public.quiz_results add column if not exists session_id uuid references public.life_sessions(id) on delete set null;
alter table public.quiz_results add column if not exists skills text[] not null default '{}';
create index if not exists quiz_attempts_goal_session_idx on public.quiz_attempts(user_id,goal_id,session_id,created_at desc);
create index if not exists quiz_results_goal_session_idx on public.quiz_results(user_id,goal_id,session_id,created_at desc);
create unique index if not exists quiz_attempts_user_key_session_uidx on public.quiz_attempts(user_id,quiz_key,session_id);
create unique index if not exists quiz_results_user_source_session_uidx on public.quiz_results(user_id,source,session_id);
alter table public.quiz_attempts alter column goal_id set not null;
alter table public.quiz_attempts alter column session_id set not null;
alter table public.quiz_results alter column goal_id set not null;
alter table public.quiz_results alter column session_id set not null;

-- Server-only reward writer: all XP, LifePoints and LifeCoins are recorded together.
create or replace function public.award_lifepilot_reward(p_source_type text,p_source_id uuid,p_xp integer,p_coins integer,p_lifepoints integer default 0,p_goal_id uuid default null,p_session_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); inserted boolean:=false; newxp integer; newlevel integer; newcoins integer; newlp integer; key text;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if p_source_type is null or length(trim(p_source_type))=0 or p_source_id is null then raise exception 'Invalid reward source'; end if;
 if p_xp<0 or p_coins<0 or p_lifepoints<0 then raise exception 'Invalid reward amount'; end if;
 key:=p_source_type||':'||p_source_id::text;
 insert into public.reward_ledger(user_id,source_type,source_id,xp,lifepoints,lifecoins,goal_id,session_id,idempotency_key) values(uid,p_source_type,p_source_id::text,p_xp,p_lifepoints,p_coins,p_goal_id,p_session_id,key) on conflict(user_id,idempotency_key) do nothing;
 inserted:=found;
 if inserted then update public.profiles set xp=coalesce(xp,0)+p_xp,lifepoints=coalesce(lifepoints,0)+p_lifepoints,lifecoins=coalesce(lifecoins,0)+p_coins,level=greatest(1,floor((coalesce(xp,0)+p_xp)/250)::int+1),current_streak=case when last_activity_date=current_date then current_streak when last_activity_date=current_date-1 then current_streak+1 else 1 end,best_streak=greatest(best_streak,case when last_activity_date=current_date then current_streak when last_activity_date=current_date-1 then current_streak+1 else 1 end),last_activity_date=current_date,updated_at=now() where id=uid; end if;
 select xp,level,lifecoins,lifepoints into newxp,newlevel,newcoins,newlp from public.profiles where id=uid;
 return jsonb_build_object('awarded',inserted,'xp',newxp,'level',newlevel,'lifecoins',newcoins,'lifepoints',newlp,'idempotency_key',key);
end; $$;

-- Canonical quiz writer: every quiz is tied to both goal_id and session_id.
create or replace function public.record_quiz_result(p_quiz_key text,p_goal_id uuid,p_session_id uuid,p_score integer default 0,p_total integer default 1,p_skills text[] default '{}')
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); passed boolean; points integer:=0; coins integer:=0; lp integer:=0; attempt_id uuid; reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if p_goal_id is null or p_session_id is null then raise exception 'Quiz must be linked to goal_id and session_id'; end if;
 if not exists(select 1 from public.life_sessions where id=p_session_id and user_id=uid and goal_id=p_goal_id) then raise exception 'Invalid goal/session link'; end if;
 if p_total<=0 or p_score<0 or p_score>p_total then raise exception 'Invalid score'; end if;
 passed:=p_score*100>=p_total*60;
 insert into public.quiz_attempts(user_id,goal_id,session_id,quiz_key,score,total,passed,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,passed,coalesce(p_skills,'{}')) on conflict(user_id,quiz_key,session_id) do update set score=excluded.score,total=excluded.total,passed=excluded.passed,skills=excluded.skills returning id into attempt_id;
 if coalesce(array_length(p_skills,1),0)>0 then for i in 1..array_length(p_skills,1) loop insert into public.skill_progress(user_id,skill,mastery,attempts,correct) values(uid,p_skills[i],case when passed then round((p_score::numeric/p_total)*100)::int else 0 end,1,case when passed then 1 else 0 end) on conflict(user_id,skill) do update set attempts=skill_progress.attempts+1,correct=skill_progress.correct+case when passed then 1 else 0 end,mastery=least(100,greatest(0,round(skill_progress.mastery*0.7+(case when passed then 100 else 0 end)*0.3)::int)),updated_at=now(); end loop; end if;
 if passed then points:=case when p_score=p_total then 50 when p_score*100>=80*p_total then 35 else 25 end; coins:=case when p_score=p_total then 5 when p_score*100>=80*p_total then 3 else 2 end; lp:=points; reward:=public.award_lifepilot_reward('quiz',attempt_id,points,coins,lp,p_goal_id,p_session_id); else reward:=jsonb_build_object('awarded',false,'xp',0,'lifepoints',0,'lifecoins',0); end if;
 insert into public.quiz_results(user_id,goal_id,session_id,source,score,total,lifepoints,lifecoins,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,case when passed then lp else 0 end,case when passed then coins else 0 end,coalesce(p_skills,'{}')) on conflict(user_id,source,session_id) do update set score=excluded.score,total=excluded.total,lifepoints=excluded.lifepoints,lifecoins=excluded.lifecoins,skills=excluded.skills;
 return jsonb_build_object('passed',passed,'attempt_id',attempt_id,'xp',coalesce(reward->>'xp','0')::int,'lifepoints',coalesce(reward->>'lifepoints','0')::int,'lifecoins',coalesce(reward->>'lifecoins','0')::int,'awarded',coalesce((reward->>'awarded')::boolean,false));
end; $$;

-- A completed session is rewarded exactly once and only after a passed quiz.
create or replace function public.complete_life_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.life_sessions; q boolean; reward jsonb;
begin select * into s from public.life_sessions where id=p_session_id and user_id=auth.uid() for update; if not found then raise exception 'Session not found'; end if; if s.status='completed' then return public.award_lifepilot_reward('session',s.id,s.xp_reward,s.coin_reward,0,s.goal_id,s.id); end if; select exists(select 1 from public.life_quiz_passes where user_id=auth.uid() and session_id=s.id and expires_at>now()) into q; if not q then raise exception 'Quiz required before completing the session'; end if; update public.life_sessions set status='completed',updated_at=now() where id=s.id; reward:=public.award_lifepilot_reward('session',s.id,s.xp_reward,s.coin_reward,0,s.goal_id,s.id); delete from public.life_quiz_passes where user_id=auth.uid() and session_id=s.id; return reward; end; $$;

revoke all on function public.award_lifepilot_reward(text,uuid,integer,integer) from public,anon,authenticated;
revoke all on function public.award_lifepilot_reward(text,uuid,integer,integer,integer,uuid,uuid) from public,anon,authenticated;
revoke all on function public.award_quiz_reward(integer,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) to authenticated;
grant execute on function public.complete_life_session(uuid) to authenticated;
