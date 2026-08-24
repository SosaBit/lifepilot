-- Canonical gameplay gate: mission -> focus -> quiz -> reward.
-- Sessions automatically bind to the next incomplete mission for the selected goal.
alter table public.life_sessions add column if not exists goal_task_id uuid references public.goal_tasks(id) on delete set null;
create index if not exists life_sessions_goal_task_idx on public.life_sessions(user_id,goal_id,goal_task_id,created_at desc);

create or replace function public.bind_lifepilot_session_task()
returns trigger language plpgsql security definer set search_path=public as $$
declare task_id uuid;
begin
  if new.goal_task_id is null then
    select id into task_id from public.goal_tasks
    where user_id=new.user_id and goal_id=new.goal_id and completed=false
      and task_date<=current_date
    order by task_date asc, created_at asc limit 1;
    if task_id is not null then new.goal_task_id:=task_id; end if;
  end if;
  return new;
end; $$;
drop trigger if exists bind_lifepilot_session_task on public.life_sessions;
create trigger bind_lifepilot_session_task
before insert on public.life_sessions for each row execute function public.bind_lifepilot_session_task();

create or replace function public.record_quiz_result(p_quiz_key text,p_goal_id uuid,p_session_id uuid,p_score integer default 0,p_total integer default 1,p_skills text[] default '{}')
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); s public.life_sessions; passed boolean; points integer:=0; coins integer:=0; lp integer:=0; attempt_id uuid; reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=uid and goal_id=p_goal_id for update;
 if not found then raise exception 'Invalid goal/session link'; end if;
 if s.goal_task_id is null then raise exception 'Session must be linked to a mission'; end if;
 if s.status='completed' then raise exception 'Session already completed'; end if;
 if s.starts_at is null or now() < s.starts_at + make_interval(secs=>greatest(60,coalesce(s.min_duration_seconds,60))) then raise exception 'Minimum focus duration not reached'; end if;
 if s.ends_at is not null and now() < s.ends_at then raise exception 'Focus session is still running'; end if;
 if p_total<=0 or p_score<0 or p_score>p_total then raise exception 'Invalid score'; end if;
 passed:=p_score*100>=p_total*60;
 insert into public.quiz_attempts(user_id,goal_id,session_id,quiz_key,score,total,passed,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,passed,coalesce(p_skills,'{}')) on conflict(user_id,quiz_key,session_id) do update set score=excluded.score,total=excluded.total,passed=excluded.passed,skills=excluded.skills returning id into attempt_id;
 if coalesce(array_length(p_skills,1),0)>0 then
   for i in 1..array_length(p_skills,1) loop
     insert into public.skill_progress(user_id,skill,mastery,attempts,correct) values(uid,p_skills[i],case when passed then round((p_score::numeric/p_total)*100)::int else 0 end,1,case when passed then 1 else 0 end)
     on conflict(user_id,skill) do update set attempts=skill_progress.attempts+1,correct=skill_progress.correct+case when passed then 1 else 0 end,mastery=least(100,greatest(0,round(skill_progress.mastery*0.7+(case when passed then 100 else 0 end)*0.3)::int)),updated_at=now();
   end loop;
 end if;
 if passed then
   points:=case when p_score=p_total then 50 when p_score*100>=80*p_total then 35 else 25 end;
   coins:=case when p_score=p_total then 5 when p_score*100>=80*p_total then 3 else 2 end;
   lp:=points;
   reward:=public.award_lifepilot_reward('quiz',attempt_id,points,coins,lp,p_goal_id,p_session_id);
   insert into public.life_quiz_passes(user_id,session_id,expires_at) values(uid,p_session_id,now()+interval '30 minutes') on conflict (user_id,session_id) do update set expires_at=excluded.expires_at;
 else reward:=jsonb_build_object('awarded',false,'xp',0,'lifepoints',0,'lifecoins',0); end if;
 insert into public.quiz_results(user_id,goal_id,session_id,source,score,total,lifepoints,lifecoins,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,case when passed then lp else 0 end,case when passed then coins else 0 end,coalesce(p_skills,'{}')) on conflict(user_id,source,session_id) do update set score=excluded.score,total=excluded.total,lifepoints=excluded.lifepoints,lifecoins=excluded.lifecoins,skills=excluded.skills;
 return jsonb_build_object('passed',passed,'attempt_id',attempt_id,'xp',coalesce(reward->>'xp','0')::int,'lifepoints',coalesce(reward->>'lifepoints','0')::int,'lifecoins',coalesce(reward->>'lifecoins','0')::int,'awarded',coalesce((reward->>'awarded')::boolean,false));
end; $$;

grant execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) to authenticated;

create or replace function public.complete_life_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.life_sessions; q boolean; reward jsonb;
begin
 select * into s from public.life_sessions where id=p_session_id and user_id=auth.uid() for update;
 if not found then raise exception 'Session not found'; end if;
 if s.status='completed' then return public.award_lifepilot_reward('session',s.id,s.xp_reward,s.coin_reward,0,s.goal_id,s.id); end if;
 if s.goal_task_id is null then raise exception 'Session has no mission'; end if;
 if s.starts_at is null or now() < s.starts_at + make_interval(secs=>greatest(60,coalesce(s.min_duration_seconds,60))) then raise exception 'Minimum focus duration not reached'; end if;
 if s.ends_at is not null and now() < s.ends_at then raise exception 'Focus session is still running'; end if;
 select exists(select 1 from public.life_quiz_passes where user_id=auth.uid() and session_id=s.id and expires_at>now()) into q;
 if not q then raise exception 'Quiz required before completing the session'; end if;
 update public.life_sessions set status='completed',updated_at=now() where id=s.id;
 update public.goal_tasks set completed=true where id=s.goal_task_id and user_id=auth.uid();
 reward:=public.award_lifepilot_reward('session',s.id,s.xp_reward,s.coin_reward,0,s.goal_id,s.id);
 delete from public.life_quiz_passes where user_id=auth.uid() and session_id=s.id;
 return reward;
end; $$;
grant execute on function public.complete_life_session(uuid) to authenticated;
