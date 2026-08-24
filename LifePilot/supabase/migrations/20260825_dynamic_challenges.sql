-- Dynamic challenges: progress is derived from real activity; client-supplied amounts are ignored.
alter table public.life_challenges add column if not exists challenge_type text not null default 'missions';
alter table public.life_challenges add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function public.complete_lifepilot_challenge(p_challenge_id uuid,p_amount integer default 1)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); c public.life_challenges; computed integer:=0; newly_completed boolean:=false; reward jsonb; begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select * into c from public.life_challenges where id=p_challenge_id and user_id=uid for update;
 if not found then raise exception 'Challenge not found'; end if;
 if c.completed_at is not null then return jsonb_build_object('completed',true,'progress',c.progress,'xp',0,'lifecoins',0,'duplicate',true); end if;
 computed:=case c.challenge_type
   when 'focus' then (select count(*) from public.life_sessions s where s.user_id=uid and s.status='completed' and s.completed_at::date between c.starts_on and least(c.ends_on,current_date))
   when 'quiz' then (select count(*) from public.quiz_attempts q where q.user_id=uid and q.passed=true and q.created_at::date between c.starts_on and least(c.ends_on,current_date))
   when 'streak' then least(c.target,coalesce((select best_streak from public.profiles where id=uid),0))
   when 'skill' then least(c.target,coalesce((select mastery/20 from public.skill_progress where user_id=uid and skill=c.metadata->>'skill'),0))
   else (select count(*) from public.goal_tasks gt where gt.user_id=uid and gt.completed=true and gt.task_date between c.starts_on and least(c.ends_on,current_date))
 end;
 computed:=least(c.target,greatest(0,computed));
 newly_completed:=computed>=c.target;
 update public.life_challenges set progress=computed,completed_at=case when newly_completed then coalesce(completed_at,now()) else completed_at end where id=c.id;
 if newly_completed then reward:=public.award_lifepilot_reward('challenge',c.id,c.xp_reward,c.coin_reward,0,null,null); else reward:=jsonb_build_object('awarded',false,'xp',0,'lifecoins',0); end if;
 return jsonb_build_object('completed',newly_completed,'progress',computed,'xp',coalesce((reward->>'xp')::int,0),'lifecoins',coalesce((reward->>'lifecoins')::int,0),'duplicate',false);
end; $$;
revoke all on function public.complete_lifepilot_challenge(uuid,integer) from public,anon;
grant execute on function public.complete_lifepilot_challenge(uuid,integer) to authenticated;

-- Replace the generic challenge generator with a behavior-aware challenge.
create or replace function public.evaluate_progression()
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); unlocked integer:=0; challenge_id uuid; ach record; reward jsonb; end_date date; ctype text; ctitle text; cdesc text; ctarget integer; cmeta jsonb:='{}'::jsonb; weak_skill text;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 for ach in select id,code,xp_reward,coin_reward from public.life_achievements order by created_at loop
   if exists(select 1 from public.life_user_achievements ua where ua.user_id=uid and ua.achievement_id=ach.id) then continue; end if;
   if (ach.code='first_quiz' and exists(select 1 from public.quiz_attempts where user_id=uid and passed=true)) or (ach.code='quiz_master' and (select count(*) from public.quiz_attempts where user_id=uid and passed=true)>=10) or (ach.code='seven_day_streak' and coalesce((select best_streak from public.profiles where id=uid),0)>=7) or (ach.code='level_5' and coalesce((select level from public.profiles where id=uid),1)>=5) or (ach.code='skill_master' and exists(select 1 from public.skill_progress where user_id=uid and mastery>=80)) then
     insert into public.life_user_achievements(user_id,achievement_id,unlocked_at) values(uid,ach.id,now()) on conflict(user_id,achievement_id) do nothing;
     if found then reward:=public.award_lifepilot_reward('achievement',ach.id,coalesce(ach.xp_reward,0),coalesce(ach.coin_reward,0),0,null,null); insert into public.user_achievements(user_id,achievement_id) select uid,a.id from public.achievements a where a.code=ach.code on conflict do nothing; unlocked:=unlocked+1; end if;
   end if;
 end loop;
 select id into challenge_id from public.life_challenges where user_id=uid and ends_on>=current_date and completed_at is null order by ends_on desc limit 1;
 if challenge_id is null then
   select skill into weak_skill from public.skill_progress where user_id=uid order by coalesce(weak_score,1) desc,coalesce(mastery,0) asc limit 1;
   if weak_skill is not null then ctype:='skill'; ctitle:='Skill Focus'; cdesc:='Migliora la skill più debole di almeno 20 punti di mastery.'; ctarget:=1; cmeta:=jsonb_build_object('skill',weak_skill); else ctype:='focus'; ctitle:='Focus Master'; cdesc:='Completa 3 sessioni Focus reali questa settimana.'; ctarget:=3; end if;
   end_date:=current_date+6;
   insert into public.life_challenges(user_id,title,description,target,progress,xp_reward,coin_reward,starts_on,ends_on,challenge_type,metadata) values(uid,ctitle,cdesc,ctarget,0,100,50,current_date,end_date,ctype,cmeta) returning id into challenge_id;
 end if;
 perform public.complete_lifepilot_challenge(challenge_id,1);
 return jsonb_build_object('unlocked',unlocked,'challenge_id',challenge_id);
end; $$;
revoke all on function public.evaluate_progression() from public,anon;
grant execute on function public.evaluate_progression() to authenticated;
