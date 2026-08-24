-- Adaptive mastery v2: confidence, recency-aware question selection, and score-weighted mastery.
alter table public.skill_progress add column if not exists confidence numeric not null default 0;
alter table public.skill_progress add column if not exists last_difficulty text;
alter table public.skill_progress add column if not exists last_attempt_at timestamptz;
alter table public.skill_progress add column if not exists weak_score numeric not null default 0;
alter table public.skill_progress add constraint skill_progress_confidence_check check (confidence >= 0 and confidence <= 1);
alter table public.skill_progress add constraint skill_progress_weak_score_check check (weak_score >= 0 and weak_score <= 1);

create or replace function public.get_adaptive_quiz(p_session_id uuid,p_goal_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if not exists(select 1 from public.life_sessions where id=p_session_id and user_id=uid and goal_id=p_goal_id and status='active') then raise exception 'Invalid active session'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'skill',q.skill,'difficulty',q.difficulty,'question',q.question,'options',q.options) order by q.skill), '[]'::jsonb)
 into result
 from (
   select distinct on (q.skill) q.id,q.skill,q.difficulty,q.question,q.options
   from public.quiz_bank q
   left join public.skill_progress s on s.user_id=uid and s.skill=q.skill
   where q.active
     and q.difficulty=case
       when coalesce(s.mastery,0)<35 then 'easy'
       when coalesce(s.mastery,0)<70 then 'medium'
       else 'hard'
     end
     and not exists (
       select 1 from public.quiz_attempts qa
       where qa.user_id=uid
         and q.id = any(coalesce(qa.question_ids,'{}'::uuid[]))
         and qa.created_at > now()-interval '14 days'
     )
   order by q.skill, coalesce(s.weak_score,1) desc, coalesce(s.last_attempt_at,'epoch'::timestamptz), q.created_at desc
 ) q;

 if jsonb_array_length(result)=0 then
   select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'skill',q.skill,'difficulty',q.difficulty,'question',q.question,'options',q.options) order by q.skill), '[]'::jsonb)
   into result
   from (
     select distinct on (q.skill) q.id,q.skill,q.difficulty,q.question,q.options
     from public.quiz_bank q
     left join public.skill_progress s on s.user_id=uid and s.skill=q.skill
     where q.active
       and q.difficulty=case when coalesce(s.mastery,0)<35 then 'easy' when coalesce(s.mastery,0)<70 then 'medium' else 'hard' end
     order by q.skill, coalesce(s.weak_score,1) desc, q.created_at desc
   ) q;
 end if;
 return result;
end; $$;
revoke all on function public.get_adaptive_quiz(uuid,uuid) from public,anon;
grant execute on function public.get_adaptive_quiz(uuid,uuid) to authenticated;

create or replace function public.record_quiz_result(p_quiz_key text,p_goal_id uuid,p_session_id uuid,p_score integer default 0,p_total integer default 1,p_skills text[] default '{}',p_question_ids uuid[] default '{}')
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); s public.life_sessions; passed boolean; points integer:=0; coins integer:=0; lp integer:=0; attempt_id uuid; reward jsonb; score_pct numeric; old_mastery integer; new_mastery integer; attempt_count integer; conf numeric; skill_name text; begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if p_goal_id is null or p_session_id is null then raise exception 'Quiz must be linked to goal_id and session_id'; end if;
 if p_total<=0 or p_score<0 or p_score>p_total then raise exception 'Invalid score'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=uid for update;
 if not found or s.goal_id<>p_goal_id then raise exception 'Invalid goal/session link'; end if;
 if s.status='completed' then raise exception 'Session already completed'; end if;
 if s.starts_at is null or now() < s.starts_at + make_interval(secs=>greatest(60,coalesce(s.min_duration_seconds,60))) then raise exception 'Minimum focus duration not reached'; end if;
 if s.ends_at is not null and now()<s.ends_at then raise exception 'Focus session is still running'; end if;
 passed:=p_score*100>=p_total*60;
 score_pct:=round((p_score::numeric/p_total::numeric)*100,2);
 insert into public.quiz_attempts(user_id,goal_id,session_id,quiz_key,score,total,passed,skills,question_ids) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,passed,coalesce(p_skills,'{}'),coalesce(p_question_ids,'{}')) on conflict(user_id,quiz_key,session_id) do update set score=excluded.score,total=excluded.total,passed=excluded.passed,skills=excluded.skills,question_ids=excluded.question_ids returning id into attempt_id;
 if coalesce(array_length(p_skills,1),0)>0 then
   foreach skill_name in array p_skills loop
     select coalesce(mastery,0),coalesce(attempts,0) into old_mastery,attempt_count from public.skill_progress where user_id=uid and skill=skill_name;
     new_mastery:=least(100,greatest(0,round(coalesce(old_mastery,0)*0.65+score_pct*0.35)::int));
     attempt_count:=coalesce(attempt_count,0)+1;
     conf:=least(1,greatest(0,0.15+least(attempt_count,10)*0.06+(new_mastery/100.0)*0.45));
     insert into public.skill_progress(user_id,skill,mastery,attempts,correct,confidence,last_difficulty,last_attempt_at,weak_score)
     values(uid,skill_name,new_mastery,1,case when passed then 1 else 0,conf,case when score_pct<35 then 'easy' when score_pct<70 then 'medium' else 'hard' end,now(),greatest(0,1-score_pct/100))
     on conflict(user_id,skill) do update set
       mastery=excluded.mastery,attempts=skill_progress.attempts+1,correct=skill_progress.correct+case when passed then 1 else 0,
       confidence=excluded.confidence,last_difficulty=excluded.last_difficulty,last_attempt_at=now(),weak_score=round((skill_progress.weak_score*0.65+excluded.weak_score*0.35)::numeric,4),updated_at=now();
   end loop;
 end if;
 if passed then
   points:=case when p_score=p_total then 50 when p_score*100>=80*p_total then 35 else 25 end;
   coins:=case when p_score=p_total then 5 when p_score*100>=80*p_total then 3 else 2 end;
   lp:=points;
   reward:=public.award_lifepilot_reward('quiz',attempt_id,points,coins,lp,p_goal_id,p_session_id);
   insert into public.life_quiz_passes(user_id,session_id,expires_at) values(uid,p_session_id,now()+interval '30 minutes') on conflict(user_id,session_id) do update set expires_at=excluded.expires_at;
 else reward:=jsonb_build_object('awarded',false,'xp',0,'lifepoints',0,'lifecoins',0); end if;
 insert into public.quiz_results(user_id,goal_id,session_id,source,score,total,lifepoints,lifecoins,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,case when passed then lp else 0 end,case when passed then coins else 0 end,coalesce(p_skills,'{}')) on conflict(user_id,source,session_id) do update set score=excluded.score,total=excluded.total,lifepoints=excluded.lifepoints,lifecoins=excluded.lifecoins,skills=excluded.skills;
 return jsonb_build_object('passed',passed,'attempt_id',attempt_id,'score',p_score,'total',p_total,'xp',coalesce(reward->>'xp','0')::int,'lifepoints',coalesce(reward->>'lifepoints','0')::int,'lifecoins',coalesce(reward->>'lifecoins','0')::int);
end; $$;
revoke all on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[],uuid[]) from public,anon;
grant execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[],uuid[]) to authenticated;
