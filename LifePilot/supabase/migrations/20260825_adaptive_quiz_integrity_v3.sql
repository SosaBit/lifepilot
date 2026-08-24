-- Final adaptive quiz integrity gate: only the exact server-selected question set is accepted.
drop function if exists public.submit_adaptive_quiz(uuid,uuid,jsonb);
create function public.submit_adaptive_quiz(p_session_id uuid,p_goal_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); expected_ids uuid[]; provided_ids uuid[]; expected integer; answered integer; total integer; score integer; passed boolean; skills text[]; reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if not exists(select 1 from public.life_sessions where id=p_session_id and user_id=uid and goal_id=p_goal_id and status='active') then raise exception 'Invalid active session'; end if;
 if jsonb_typeof(p_answers)<>'array' then raise exception 'Invalid answers'; end if;
 select array_agg(id order by id) into expected_ids from (select distinct on(q.skill) q.id,q.skill from public.quiz_bank q left join public.skill_progress s on s.user_id=uid and s.skill=q.skill where q.active and q.difficulty=case when coalesce(s.mastery,0)<35 then 'easy' when coalesce(s.mastery,0)<70 then 'medium' else 'hard' end order by q.skill,coalesce(s.weak_score,1) desc,coalesce(s.last_attempt_at,'epoch'::timestamptz),q.created_at desc) selected;
 select array_agg(distinct (a->>'question_id')::uuid order by (a->>'question_id')::uuid),count(*),coalesce(sum(case when (a->>'answer')::integer=q.correct_index then 1 else 0 end),0),array_agg(distinct q.skill) into provided_ids,total,score,skills from jsonb_array_elements(p_answers) a join public.quiz_bank q on q.id=(a->>'question_id')::uuid and q.active;
 expected:=coalesce(array_length(expected_ids,1),0); answered:=coalesce(array_length(provided_ids,1),0);
 if total<>answered then raise exception 'Duplicate or invalid quiz question'; end if;
 if answered<>expected then raise exception 'Incomplete adaptive quiz'; end if;
 if expected=0 then raise exception 'No valid quiz questions'; end if;
 if provided_ids<>expected_ids then raise exception 'Quiz question set is not the server-selected set'; end if;
 passed:=score*100>=expected*60;
 reward:=public.record_quiz_result('adaptive:'||p_session_id::text,p_goal_id,p_session_id,score,expected,skills,provided_ids);
 return jsonb_build_object('passed',passed,'score',score,'total',expected,'skills',skills,'xp',coalesce((reward->>'xp')::int,0),'lifecoins',coalesce((reward->>'lifecoins')::int,0));
end; $$;
revoke all on function public.submit_adaptive_quiz(uuid,uuid,jsonb) from public,anon;
grant execute on function public.submit_adaptive_quiz(uuid,uuid,jsonb) to authenticated;
