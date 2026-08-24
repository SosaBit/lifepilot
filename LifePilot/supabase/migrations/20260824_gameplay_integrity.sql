-- Gameplay integrity hardening: prevent overlapping active focus sessions
-- and make mission binding deterministic at the database boundary.

create unique index if not exists life_sessions_one_active_per_user_idx
on public.life_sessions(user_id)
where status = 'active';

create index if not exists goal_tasks_open_by_user_goal_date_idx
on public.goal_tasks(user_id,goal_id,task_date,created_at)
where completed = false;

create or replace function public.bind_lifepilot_session_task()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  task_id uuid;
begin
  if new.user_id is null then
    raise exception 'Session requires a user';
  end if;

  if new.goal_id is null then
    raise exception 'Session requires a goal';
  end if;

  if new.goal_task_id is null then
    select gt.id
      into task_id
      from public.goal_tasks gt
     where gt.user_id = new.user_id
       and gt.goal_id = new.goal_id
       and gt.completed = false
       and gt.task_date <= current_date
     order by gt.task_date asc, gt.created_at asc
     limit 1;

    if task_id is null then
      raise exception 'No open mission is available for this goal';
    end if;

    new.goal_task_id := task_id;
  else
    if not exists (
      select 1 from public.goal_tasks gt
       where gt.id = new.goal_task_id
         and gt.user_id = new.user_id
         and gt.goal_id = new.goal_id
         and gt.completed = false
    ) then
      raise exception 'Invalid mission for goal/session';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bind_lifepilot_session_task on public.life_sessions;
create trigger bind_lifepilot_session_task
before insert on public.life_sessions
for each row execute function public.bind_lifepilot_session_task();

grant execute on function public.bind_lifepilot_session_task() to authenticated;
