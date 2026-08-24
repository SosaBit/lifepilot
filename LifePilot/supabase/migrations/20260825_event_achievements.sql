-- Event-driven achievement coverage for session, focus, goals and challenges.
insert into public.life_achievements(code,title,description,icon,xp_reward,coin_reward)
values
 ('first_session','Prima sessione','Completa la tua prima sessione Focus.','⚡',50,25),
 ('focus_10','Deep Worker','Completa 10 sessioni Focus reali.','🔥',150,75),
 ('challenge_complete','Challenge Hunter','Completa una challenge dinamica.','🏆',100,50)
on conflict(code) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,xp_reward=excluded.xp_reward,coin_reward=excluded.coin_reward;

create or replace function public.evaluate_progression()
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); unlocked integer:=0; challenge_id uuid; ach record; reward jsonb; end_date date; ctype text; ctitle text; cdesc text; ctarget integer; cmeta jsonb:='{}'::jsonb; weak_skill text;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 for ach in select id,code,xp_reward,coin_reward from public.life_achievements order by created_at loop
   if exists(select 1 from public.life_user_achievements ua where ua.user_id=uid and ua.achievement_id=ach.id) then continue; end if;
   if (ach.code='first_session' and exists(select 1 from public.life_sessions where user_id=uid and status='completed'))
      or (ach.code='focus_10' and (select count(*) from public.life_sessions where user_id=uid and status='completed')>=10)
      or (ach.code='first_quiz' and exists(select 1 from public.quiz_attempts where user_id=uid and passed=true))
      or (ach.code='quiz_master' and (select count(*) from public.quiz_attempts where user_id=uid and passed=true)>=10)
      or (ach.code='seven_day_streak' and coalesce((select best_streak from public.profiles where id=uid),0)>=7)
      or (ach.code='level_5' and coalesce((select level from public.profiles where id=uid),1)>=5)
      or (ach.code='skill_master' and exists(select 1 from public.skill_progress where user_id=uid and mastery>=80))
      or (ach.code='challenge_complete' and exists(select 1 from public.life_challenges where user_id=uid and completed_at is not null)) then
     insert into public.life_user_achievements(user_id,achievement_id,unlocked_at) values(uid,ach.id,now()) on conflict(user_id,achievement_id) do nothing;
     if found then
       reward:=public.award_lifepilot_reward('achievement',ach.id,coalesce(ach.xp_reward,0),coalesce(ach.coin_reward,0),0,null,null);
       insert into public.user_achievements(user_id,achievement_id) select uid,a.id from public.achievements a where a.code=ach.code on conflict do nothing;
       unlocked:=unlocked+1;
     end if;
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
