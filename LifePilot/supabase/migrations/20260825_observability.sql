-- Lightweight event audit trail for gameplay/reward diagnostics.
create table if not exists public.gameplay_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null,
 source_id uuid,
 payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique_key text,
 unique(user_id,unique_key)
);
alter table public.gameplay_events enable row level security;
create policy "users read own gameplay events" on public.gameplay_events for select to authenticated using (user_id=auth.uid());
revoke insert,update,delete on public.gameplay_events from public,anon,authenticated;

create or replace function public.log_gameplay_event(p_event_type text,p_source_id uuid,p_payload jsonb default '{}'::jsonb,p_unique_key text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); eid uuid; begin
 if uid is null then raise exception 'Not authenticated'; end if;
 insert into public.gameplay_events(user_id,event_type,source_id,payload,unique_key) values(uid,p_event_type,p_source_id,coalesce(p_payload,'{}'::jsonb),p_unique_key) on conflict(user_id,unique_key) do update set payload=excluded.payload returning id into eid;
 return eid;
end; $$;
revoke all on function public.log_gameplay_event(text,uuid,jsonb,text) from public,anon,authenticated;

create index if not exists gameplay_events_user_created_idx on public.gameplay_events(user_id,created_at desc);
create index if not exists gameplay_events_type_created_idx on public.gameplay_events(event_type,created_at desc);
