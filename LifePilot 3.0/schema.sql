create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  days integer not null default 30,
  daily_minutes integer not null default 20,
  progress integer not null default 0,
  streak integer not null default 0,
  plan jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;
alter table public.goal_tasks enable row level security;

create policy "Users manage their own goals"
on public.goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage their own tasks"
on public.goal_tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
