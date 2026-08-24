-- Final functional-gate hardening. Applied to production Supabase project rhafdhwixhqxufylavag.

create or replace function public.record_quiz_result(p_quiz_key text,p_goal_id uuid,p_session_id uuid,p_score integer default 0,p_total integer default 1,p_skills text[] default '{}',p_question_ids uuid[] default '{}') returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); s public.life_sessions; passed boolean; points integer:=0; coins integer:=0; lp integer:=0; attempt_id uuid; reward jsonb; existing public.quiz_attempts;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if p_goal_id is null or p_session_id is null then raise exception 'Quiz must be linked to goal_id and session_id'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=uid for update;
 if not found or s.goal_id<>p_goal_id then raise exception 'Invalid goal/session link'; end if;
 if s.status not in ('active','scheduled') then raise exception 'Session is not available for quiz'; end if;
 if extract(epoch from (now()-s.starts_at)) < greatest(1,coalesce(s.min_duration_seconds,300)) then raise exception 'Focus duration minimum not reached'; end if;
 if p_total<=0 or p_score<0 or p_score>p_total then raise exception 'Invalid score'; end if;
 select * into existing from public.quiz_attempts where user_id=uid and quiz_key=p_quiz_key and session_id=p_session_id limit 1;
 if found and existing.passed then
   select xp,lifepoints,lifecoins into points,lp,coins from public.profiles where id=uid;
   return jsonb_build_object('passed',true,'attempt_id',existing.id,'goal_id',p_goal_id,'session_id',p_session_id,'xp',points,'lifepoints',lp,'lifecoins',coins,'awarded',false,'duplicate',true);
 end if;
 passed:=p_score*100>=p_total*60;
 insert into public.quiz_attempts(user_id,goal_id,session_id,quiz_key,score,total,passed,skills,question_ids) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,passed,coalesce(p_skills,'{}'),coalesce(p_question_ids,'{}')) on conflict(user_id,quiz_key,session_id) do update set score=excluded.score,total=excluded.total,passed=excluded.passed,skills=excluded.skills,question_ids=excluded.question_ids returning id into attempt_id;
 if coalesce(array_length(p_skills,1),0)>0 then for i in 1..array_length(p_skills,1) loop insert into public.skill_progress(user_id,skill,mastery,attempts,correct) values(uid,p_skills[i],case when passed then round((p_score::numeric/p_total)*100)::int else 0 end,1,case when passed then 1 else 0 end) on conflict(user_id,skill) do update set attempts=skill_progress.attempts+1,correct=skill_progress.correct+case when passed then 1 else 0 end,mastery=least(100,greatest(0,round(skill_progress.mastery*0.7+(case when passed then (p_score::numeric/p_total)*100 else 0 end)*0.3)::int)),updated_at=now(); end loop; end if;
 if passed then
   points:=case when p_score=p_total then 50 when p_score*100>=80*p_total then 35 else 25 end; coins:=case when p_score=p_total then 5 when p_score*100>=80*p_total then 3 else 2 end; lp:=points;
   reward:=public.award_lifepilot_reward('quiz',attempt_id,points,coins,lp,p_goal_id,p_session_id);
   insert into public.life_quiz_passes(user_id,session_id,expires_at) values(uid,p_session_id,now()+interval '15 minutes') on conflict do nothing;
   perform public.grant_quiz_achievements();
 else reward:=jsonb_build_object('awarded',false,'xp',0,'lifepoints',0,'lifecoins',0); end if;
 insert into public.quiz_results(user_id,goal_id,session_id,source,score,total,lifepoints,lifecoins,skills) values(uid,p_goal_id,p_session_id,p_quiz_key,p_score,p_total,case when passed then lp else 0 end,case when passed then coins else 0 end,coalesce(p_skills,'{}')) on conflict(user_id,source,session_id) do update set score=excluded.score,total=excluded.total,lifepoints=excluded.lifepoints,lifecoins=excluded.lifecoins,skills=excluded.skills;
 return jsonb_build_object('passed',passed,'attempt_id',attempt_id,'goal_id',p_goal_id,'session_id',p_session_id,'xp',coalesce(reward->>'xp','0')::int,'lifepoints',coalesce(reward->>'lifepoints','0')::int,'lifecoins',coalesce(reward->>'lifecoins','0')::int,'awarded',coalesce((reward->>'awarded')::boolean,false));
end; $$;

create or replace function public.complete_life_session(p_session_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); s public.life_sessions; q boolean; reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=uid for update;
 if not found then raise exception 'Session not found'; end if;
 if s.status='completed' then return public.award_lifepilot_reward('session',s.id,s.xp_reward,s.coin_reward,0,s.goal_id,s.id); end if;
 if s.status not in ('active','scheduled') then raise exception 'Session is not completable'; end if;
 if extract(epoch from (now()-s.starts_at)) < greatest(1,coalesce(s.min_duration_seconds,300)) then raise exception 'Focus duration minimum not reached'; end if;
 select exists(select 1 from public.life_quiz_passes where user_id=uid and session_id=s.id and expires_at>now()) into q;
 if not q then raise exception 'Quiz required before completing the session'; end if;
 update public.life_sessions set status='completed',completed_at=now(),updated_at=now() where id=s.id;
 reward:=public.award_lifepilot_reward('session',s.id,s.xp_reward,s.coin_reward,0,s.goal_id,s.id);
 delete from public.life_quiz_passes where user_id=uid and session_id=s.id;
 return reward;
end; $$;

create or replace function public.redeem_lifecoins(p_item_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); item public.life_shop_items; existing public.life_shop_redemptions; code text;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select * into existing from public.life_shop_redemptions where user_id=uid and item_id=p_item_id order by redeemed_at asc limit 1;
 if found then return jsonb_build_object('code',existing.voucher_code,'discount_percent',existing.discount_percent,'coins_spent',existing.coins_spent,'duplicate',true); end if;
 select * into item from public.life_shop_items where id=p_item_id and active=true;
 if not found then raise exception 'Item non disponibile'; end if;
 update public.profiles set lifecoins=lifecoins-item.coins_cost where id=uid and lifecoins>=item.coins_cost;
 if not found then raise exception 'LifeCoins insufficienti'; end if;
 code:=item.code_prefix||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.life_shop_redemptions(user_id,item_id,coins_spent,voucher_code,discount_percent) values(uid,item.id,item.coins_cost,code,item.discount_percent);
 return jsonb_build_object('code',code,'discount_percent',item.discount_percent,'coins_spent',item.coins_cost,'duplicate',false);
end; $$;

create or replace function public.complete_lifepilot_challenge(p_challenge_id uuid,p_amount integer default 1) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); c public.life_challenges; next_progress integer; newly_completed boolean:=false; reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if p_amount<1 or p_amount>100 then raise exception 'Invalid progress amount'; end if;
 select * into c from public.life_challenges where id=p_challenge_id and user_id=uid for update;
 if not found then raise exception 'Challenge not found'; end if;
 if c.completed_at is not null then return jsonb_build_object('completed',true,'progress',c.progress,'xp',0,'lifecoins',0,'duplicate',true); end if;
 next_progress:=least(c.target,c.progress+p_amount); if next_progress>=c.target then newly_completed:=true; end if;
 update public.life_challenges set progress=next_progress,completed_at=case when newly_completed then now() else completed_at end where id=c.id;
 if newly_completed then reward:=public.award_lifepilot_reward('challenge',c.id,c.xp_reward,c.coin_reward,0,null,null); else reward:=jsonb_build_object('awarded',false,'xp',0,'lifecoins',0); end if;
 return jsonb_build_object('completed',newly_completed,'progress',next_progress,'xp',coalesce((reward->>'xp')::int,0),'lifecoins',coalesce((reward->>'lifecoins')::int,0),'duplicate',false);
end; $$;

grant execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[],uuid[]) to authenticated;
grant execute on function public.complete_life_session(uuid) to authenticated;
grant execute on function public.redeem_lifecoins(uuid) to authenticated;
grant execute on function public.complete_lifepilot_challenge(uuid,integer) to authenticated;
create unique index if not exists life_shop_redemptions_user_item_uidx on public.life_shop_redemptions(user_id,item_id);
