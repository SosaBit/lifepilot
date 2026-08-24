-- Canonical mission binding: Goal -> Mission -> Focus -> Quiz.
-- A Focus session must belong to one real, incomplete mission of the same goal.
create or replace function public.start_focus_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.life_sessions; t public.goal_tasks; now_ts timestamptz:=now();
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=auth.uid() for update;
 if not found then raise exception 'Session not found'; end if;
 if s.goal_id is null or s.goal_task_id is null then raise exception 'Focus non collegato a una missione del piano'; end if;
 select * into t from public.goal_tasks where id=s.goal_task_id and user_id=auth.uid() and goal_id=s.goal_id for update;
 if not found then raise exception 'Missione non valida per questo obiettivo'; end if;
 if t.completed then raise exception 'La missione è già completata'; end if;
 if s.status not in ('scheduled','active') then raise exception 'Sessione non avviabile'; end if;
 update public.life_sessions set status='active',starts_at=now_ts,ends_at=now_ts+make_interval(secs=>greatest(60,min_duration_seconds)),updated_at=now() where id=s.id;
 return jsonb_build_object('started',true,'session_id',s.id,'goal_id',s.goal_id,'goal_task_id',s.goal_task_id,'started_at',now_ts,'min_duration_seconds',greatest(60,s.min_duration_seconds));
end; $$;

-- Passing the quiz closes the exact mission that produced the Focus session.
create or replace function public.record_quiz_result(p_quiz_key text,p_goal_id uuid,p_session_id uuid,p_score integer default 0,p_total integer default 1,p_skills text[] default '{}')
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); s public.life_sessions; t public.goal_tasks; passed boolean; points integer:=0; coins integer:=0; lp integer:=0; attempt_id uuid; reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if p_goal_id is null or p_session_id is null then raise exception 'Quiz must be linked to goal_id and session_id'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=uid for update;
 if not found or s.goal_id<>p_goal_id or s.goal_task_id is null then raise exception 'Invalid goal/session/mission link'; end if;
 if s.status<>'completed' then raise exception 'Complete the Focus session before the quiz'; end if;
 select * into t from public.goal_tasks where id=s.goal_task_id and user_id=uid and goal_id=p_goal_id for update;
 if not found then raise exception 'Mission not found'; end if;
 if p_total<=0 or p_score<0 or p_score>p_total then raise exception 'Invalid score'; end if;
 passed:=p_score*100>=p_total*60;
 insert into public.quiz_attempts(user_id,goal_id,session_id,quiz_key,score,total,passed,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,passed,coalesce(p_skills,'{}')) on conflict(user_id,quiz_key,session_id) do update set score=excluded.score,total=excluded.total,passed=excluded.passed,skills=excluded.skills returning id into attempt_id;
 if coalesce(array_length(p_skills,1),0)>0 then for i in 1..array_length(p_skills,1) loop insert into public.skill_progress(user_id,skill,mastery,attempts,correct) values(uid,p_skills[i],case when passed then round((p_score::numeric/p_total)*100)::int else 0 end,1,case when passed then 1 else 0 end) on conflict(user_id,skill) do update set attempts=skill_progress.attempts+1,correct=skill_progress.correct+case when passed then 1 else 0 end,mastery=least(100,greatest(0,round(skill_progress.mastery*0.7+(case when passed then 100 else 0 end)*0.3)::int)),updated_at=now(); end loop; end if;
 if passed then
   points:=case when p_score=p_total then 50 when p_score*100>=80*p_total then 35 else 25 end;
   coins:=case when p_score=p_total then 5 when p_score*100>=80*p_total then 3 else 2 end;
   lp:=points;
   reward:=public.award_lifepilot_reward('quiz',attempt_id,points,coins,lp,p_goal_id,p_session_id);
   update public.goal_tasks set completed=true where id=t.id and user_id=uid and completed=false;
 else reward:=jsonb_build_object('awarded',false,'xp',0,'lifepoints',0,'lifecoins',0); end if;
 insert into public.quiz_results(user_id,goal_id,session_id,source,score,total,lifepoints,lifecoins,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,case when passed then lp else 0 end,case when passed then coins else 0 end,coalesce(p_skills,'{}')) on conflict(user_id,source,session_id) do update set score=excluded.score,total=excluded.total,lifepoints=excluded.lifepoints,lifecoins=excluded.lifecoins,skills=excluded.skills;
 return jsonb_build_object('passed',passed,'attempt_id',attempt_id,'goal_id',p_goal_id,'session_id',p_session_id,'goal_task_id',s.goal_task_id,'xp',coalesce(reward->>'xp','0')::int,'lifepoints',coalesce(reward->>'lifepoints','0')::int,'lifecoins',coalesce(reward->>'lifecoins','0')::int,'awarded',coalesce((reward->>'awarded')::boolean,false));
end; $$;
revoke execute on function public.start_focus_session(uuid) from anon;
grant execute on function public.start_focus_session(uuid) to authenticated;
revoke execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) from anon;
grant execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) to authenticated;
