-- Canonical progression/achievement reward path + shop concurrency guard.
create unique index if not exists life_shop_redemptions_user_item_uidx on public.life_shop_redemptions(user_id,item_id);

create or replace function public.evaluate_progression()
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); unlocked integer:=0; challenge_id uuid; ach record; reward jsonb; end_date date;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 for ach in select id,code,xp_reward,coin_reward from public.life_achievements order by created_at loop
   if exists(select 1 from public.life_user_achievements ua where ua.user_id=uid and ua.achievement_id=ach.id) then continue; end if;
   if (ach.code='first_quiz' and exists(select 1 from public.quiz_attempts where user_id=uid and passed=true))
      or (ach.code='quiz_master' and (select count(*) from public.quiz_attempts where user_id=uid and passed=true)>=10)
      or (ach.code='seven_day_streak' and coalesce((select best_streak from public.profiles where id=uid),0)>=7)
      or (ach.code='level_5' and coalesce((select level from public.profiles where id=uid),1)>=5)
      or (ach.code='skill_master' and exists(select 1 from public.skill_progress where user_id=uid and mastery>=80)) then
     insert into public.life_user_achievements(user_id,achievement_id,unlocked_at) values(uid,ach.id,now()) on conflict(user_id,achievement_id) do nothing;
     if found then
       reward:=public.award_lifepilot_reward('achievement',ach.id,coalesce(ach.xp_reward,0),coalesce(ach.coin_reward,0),0,null,null);
       insert into public.user_achievements(user_id,achievement_id) select uid,a.id from public.achievements a where a.code=ach.code on conflict do nothing;
       unlocked:=unlocked+1;
     end if;
   end if;
 end loop;
 select id into challenge_id from public.life_challenges where user_id=uid and ends_on>=current_date order by ends_on desc limit 1;
 if challenge_id is null then
   end_date:=current_date+6;
   insert into public.life_challenges(user_id,title,description,target,progress,xp_reward,coin_reward,starts_on,ends_on) values(uid,'7 giorni di progresso','Completa almeno 5 attività del tuo percorso in 7 giorni.',5,0,100,20,current_date,end_date) returning id into challenge_id;
 end if;
 update public.life_challenges c set progress=least(c.target,(select count(*) from public.goal_tasks gt where gt.user_id=uid and gt.completed=true and gt.task_date between c.starts_on and current_date)),completed_at=case when (select count(*) from public.goal_tasks gt where gt.user_id=uid and gt.completed=true and gt.task_date between c.starts_on and current_date)>=c.target then coalesce(c.completed_at,now()) else null end where c.id=challenge_id;
 return jsonb_build_object('unlocked',unlocked,'challenge_id',challenge_id);
end; $$;
revoke all on function public.evaluate_progression() from anon,authenticated;
grant execute on function public.evaluate_progression() to authenticated;

create or replace function public.grant_quiz_achievements()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 return public.evaluate_progression();
end; $$;
revoke all on function public.grant_quiz_achievements() from anon,authenticated;
grant execute on function public.grant_quiz_achievements() to authenticated;

-- Compatibility wrapper for the existing frontend while the canonical RPC also accepts question_ids.
create or replace function public.record_quiz_result(p_quiz_key text,p_goal_id uuid,p_session_id uuid,p_score integer default 0,p_total integer default 1,p_skills text[] default '{}')
returns jsonb language sql security invoker set search_path=public as $$
 select public.record_quiz_result(p_quiz_key,p_goal_id,p_session_id,p_score,p_total,p_skills,'{}'::uuid[]);
$$;
revoke all on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) from anon;
grant execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) to authenticated;

-- Compatibility columns for the existing achievement read model.
alter table public.achievements add column if not exists xp_reward integer not null default 0;
alter table public.achievements add column if not exists coin_reward integer not null default 0;
update public.achievements a set xp_reward=coalesce(l.xp_reward,coalesce(a.xp,0)),coin_reward=coalesce(l.coin_reward,0) from public.life_achievements l where l.code=a.code;
