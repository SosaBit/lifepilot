-- Progression identity: timezone-aware streaks and explicit XP/title summary.
alter table public.profiles add column if not exists timezone text not null default 'UTC';

create or replace function public.set_user_timezone(p_timezone text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); begin
 if uid is null then raise exception 'Not authenticated'; end if;
 perform now() at time zone p_timezone;
 update public.profiles set timezone=p_timezone,updated_at=now() where id=uid;
 return jsonb_build_object('timezone',p_timezone);
exception when invalid_parameter_value then raise exception 'Invalid timezone'; end; $$;
revoke all on function public.set_user_timezone(text) from public,anon;
grant execute on function public.set_user_timezone(text) to authenticated;

create or replace function public.get_progression_summary()
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); p public.profiles; next_xp integer; current_floor integer; title text; begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select * into p from public.profiles where id=uid;
 current_floor:=greatest(0,(coalesce(p.level,1)-1)*250);
 next_xp:=coalesce(p.level,1)*250;
 title:=case when coalesce(p.level,1)>=20 then 'Master Strategist' when p.level>=15 then 'Elite Strategist' when p.level>=10 then 'Strategist' when p.level>=7 then 'Focused Builder' when p.level>=5 then 'Disciplined' when p.level>=3 then 'Practitioner' else 'Novice' end;
 return jsonb_build_object('xp',coalesce(p.xp,0),'level',coalesce(p.level,1),'title',title,'xp_into_level',greatest(0,coalesce(p.xp,0)-current_floor),'xp_for_next_level',greatest(1,next_xp-current_floor),'lifecoins',coalesce(p.lifecoins,0),'current_streak',coalesce(p.current_streak,0),'best_streak',coalesce(p.best_streak,0),'timezone',coalesce(p.timezone,'UTC'));
end; $$;
revoke all on function public.get_progression_summary() from public,anon;
grant execute on function public.get_progression_summary() to authenticated;

create or replace function public.award_lifepilot_reward(p_source_type text,p_source_id uuid,p_xp integer,p_coins integer,p_lifepoints integer default 0,p_goal_id uuid default null,p_session_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); inserted boolean:=false; newxp integer; newlevel integer; newcoins integer; newlp integer; key text; local_day date; begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if p_source_type is null or length(trim(p_source_type))=0 or p_source_id is null then raise exception 'Invalid reward source'; end if;
 if p_xp<0 or p_coins<0 or p_lifepoints<0 then raise exception 'Invalid reward amount'; end if;
 select (now() at time zone coalesce(timezone,'UTC'))::date into local_day from public.profiles where id=uid for update;
 key:=p_source_type||':'||p_source_id::text;
 insert into public.reward_ledger(user_id,source_type,source_id,xp,lifepoints,lifecoins,goal_id,session_id,idempotency_key) values(uid,p_source_type,p_source_id::text,p_xp,p_lifepoints,p_coins,p_goal_id,p_session_id,key) on conflict(user_id,idempotency_key) do nothing;
 inserted:=found;
 if inserted then update public.profiles set xp=coalesce(xp,0)+p_xp,lifepoints=coalesce(lifepoints,0)+p_lifepoints,lifecoins=coalesce(lifecoins,0)+p_coins,level=greatest(1,floor((coalesce(xp,0)+p_xp)/250)::int+1),current_streak=case when last_activity_date=local_day then current_streak when last_activity_date=local_day-1 then current_streak+1 else 1 end,best_streak=greatest(best_streak,case when last_activity_date=local_day then current_streak when last_activity_date=local_day-1 then current_streak+1 else 1 end),last_activity_date=local_day,updated_at=now() where id=uid; end if;
 select xp,level,lifecoins,lifepoints into newxp,newlevel,newcoins,newlp from public.profiles where id=uid;
 return jsonb_build_object('awarded',inserted,'xp',newxp,'level',newlevel,'lifecoins',newcoins,'lifepoints',newlp,'idempotency_key',key);
end; $$;
revoke all on function public.award_lifepilot_reward(text,uuid,integer,integer,integer,uuid,uuid) from public,anon,authenticated;

