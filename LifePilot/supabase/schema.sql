-- LifePilot production schema (canonical reference)
-- Supabase project: rhafdhwixhqxufylavag

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  birth_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role text not null default 'user' check (role in ('user', 'admin'))
);

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

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  level text not null default 'info',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  kind text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Admin helper used by RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Users may edit their profile, but cannot elevate their own role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.goal_tasks enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- Goals
create policy "Users can view their own goals"
on public.goals for select
using (auth.uid() = user_id);

create policy "Users can create their own goals"
on public.goals for insert
with check (auth.uid() = user_id);

create policy "Users can update their own goals"
on public.goals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
on public.goals for delete
using (auth.uid() = user_id);

-- Goal tasks
create policy "Users manage their own tasks"
on public.goal_tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Events / announcements: public only when published, admin otherwise.
create policy "published events are readable"
on public.events for select
using (published = true or public.is_admin());

create policy "admins manage events"
on public.events for all
using (public.is_admin())
with check (public.is_admin());

create policy "published announcements are readable"
on public.announcements for select
using (published = true or public.is_admin());

create policy "admins manage announcements"
on public.announcements for all
using (public.is_admin())
with check (public.is_admin());

-- Notifications: only recipient can read/update; only admins can create.
create policy "users read own notifications"
on public.notifications for select
using (auth.uid() = user_id);

create policy "users update own notifications"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "admins create notifications"
on public.notifications for insert
with check (public.is_admin());

-- Updated-at triggers.
drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- Prevent role escalation. Keep one canonical trigger.
drop trigger if exists protect_profile_role on public.profiles;
drop trigger if exists protect_profile_role_before_update on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- Realtime tables used by LifePilot.
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.goals;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.goal_tasks;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.announcements;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
