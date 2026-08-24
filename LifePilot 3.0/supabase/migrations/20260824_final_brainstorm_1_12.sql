alter table public.life_sessions add column if not exists goal_task_id uuid references public.goal_tasks(id) on delete set null;
create index if not exists life_sessions_goal_task_idx on public.life_sessions(user_id,goal_id,goal_task_id,created_at desc);
-- LifePilot 2.0 completion: adaptive quiz, anti-cheat, streak integrity, LifeCoins shop, coach support.

alter table public.life_sessions drop constraint if exists life_sessions_status_check;
alter table public.life_sessions add constraint life_sessions_status_check check(status in ('scheduled','active','completed','skipped','cancelled'));
alter table public.life_sessions add column if not exists min_duration_seconds integer not null default 300;
alter table public.life_sessions add column if not exists completed_at timestamptz;

create table if not exists public.quiz_bank (
 id uuid primary key default gen_random_uuid(),
 skill text not null,
 difficulty text not null check(difficulty in ('easy','medium','hard')),
 question text not null,
 options jsonb not null,
 correct_index integer not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create index if not exists quiz_bank_skill_difficulty_idx on public.quiz_bank(skill,difficulty) where active=true;

create table if not exists public.life_user_shop_items (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 item_id uuid not null references public.life_shop_items(id) on delete cascade,
 acquired_at timestamptz not null default now(),
 unique(user_id,item_id)
);

alter table public.life_shop_items enable row level security;
drop policy if exists "shop items readable" on public.life_shop_items;
create policy "shop items readable" on public.life_shop_items for select using (active=true);
alter table public.life_user_shop_items enable row level security;
drop policy if exists "users read own shop items" on public.life_user_shop_items;
create policy "users read own shop items" on public.life_user_shop_items for select using (auth.uid()=user_id);

create or replace function public.start_focus_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.life_sessions; now_ts timestamptz:=now();
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=auth.uid() for update;
 if not found then raise exception 'Session not found'; end if;
 if s.status not in ('scheduled','active') then raise exception 'Sessione non avviabile'; end if;
 update public.life_sessions set status='active',starts_at=now_ts,ends_at=now_ts+make_interval(secs=>greatest(60,min_duration_seconds)),updated_at=now() where id=s.id;
 return jsonb_build_object('started',true,'session_id',s.id,'started_at',now_ts,'min_duration_seconds',greatest(60,s.min_duration_seconds));
end; $$;

create or replace function public.complete_focus_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.life_sessions; elapsed integer;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 select * into s from public.life_sessions where id=p_session_id and user_id=auth.uid() for update;
 if not found then raise exception 'Session not found'; end if;
 if s.status='completed' then return jsonb_build_object('completed',true,'session_id',s.id,'already_completed',true); end if;
 if s.status<>'active' then raise exception 'Sessione non attiva'; end if;
 elapsed:=extract(epoch from (now()-s.starts_at))::integer;
 if elapsed < greatest(60,s.min_duration_seconds) then raise exception 'Focus troppo breve: completa almeno % secondi.',greatest(60,s.min_duration_seconds); end if;
 update public.life_sessions set status='completed',completed_at=now(),updated_at=now() where id=s.id;
 update public.profiles set current_streak=case when last_activity_date=current_date then current_streak when last_activity_date=current_date-1 then current_streak+1 else 1 end,best_streak=greatest(best_streak,case when last_activity_date=current_date then current_streak when last_activity_date=current_date-1 then current_streak+1 else 1 end),last_activity_date=current_date,updated_at=now() where id=auth.uid();
 return jsonb_build_object('completed',true,'session_id',s.id,'elapsed_seconds',elapsed);
end; $$;

create or replace function public.purchase_lifecoin_item(p_item_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); p public.profiles; i public.life_shop_items; existing boolean;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select * into i from public.life_shop_items where id=p_item_id and active=true for update;
 if not found then raise exception 'Articolo non disponibile'; end if;
 select exists(select 1 from public.life_user_shop_items where user_id=uid and item_id=p_item_id) into existing;
 if existing then return jsonb_build_object('purchased',false,'reason','already_owned'); end if;
 select * into p from public.profiles where id=uid for update;
 if coalesce(p.lifecoins,0)<i.coins_cost then raise exception 'LifeCoins insufficienti'; end if;
 update public.profiles set lifecoins=lifecoins-i.coins_cost,updated_at=now() where id=uid;
 insert into public.life_user_shop_items(user_id,item_id) values(uid,p_item_id);
 insert into public.life_shop_redemptions(user_id,item_id,coins_spent,voucher_code,discount_percent) values(uid,p_item_id,i.coins_cost,i.code_prefix||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),i.discount_percent);
 return jsonb_build_object('purchased',true,'item_id',i.id,'coins_spent',i.coins_cost,'remaining_coins',p.lifecoins-i.coins_cost);
end; $$;

create or replace function public.update_streak_from_activity()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 update public.profiles set current_streak=case when last_activity_date=current_date then current_streak when last_activity_date=current_date-1 then current_streak+1 else 1 end,best_streak=greatest(best_streak,case when last_activity_date=current_date then current_streak when last_activity_date=current_date-1 then current_streak+1 else 1 end),last_activity_date=current_date,updated_at=now() where id=new.user_id;
 return new;
end; $$;
drop trigger if exists goal_task_activity_streak on public.goal_tasks;
create trigger goal_task_activity_streak after update of completed on public.goal_tasks for each row when (new.completed=true and coalesce(old.completed,false)=false) execute function public.update_streak_from_activity();

grant execute on function public.start_focus_session(uuid) to authenticated;
grant execute on function public.complete_focus_session(uuid) to authenticated;
grant execute on function public.purchase_lifecoin_item(uuid) to authenticated;
revoke execute on function public.start_focus_session(uuid) from anon;
revoke execute on function public.complete_focus_session(uuid) from anon;
revoke execute on function public.purchase_lifecoin_item(uuid) from anon;

insert into public.life_shop_items(name,description,category,coins_cost,discount_percent,code_prefix)
values
('Avatar Aurora','Personalizzazione profilo.','avatar',50,0,'AURORA'),
('Tema Focus','Tema premium per il percorso.','theme',75,0,'FOCUS'),
('Badge Maestro','Badge cosmetico per il profilo.','badge',100,0,'MAESTRO'),
('Boost 24h','Boost cosmetico di progressione, senza alterare XP reale.','boost',150,0,'BOOST')
on conflict do nothing;

insert into public.quiz_bank(skill,difficulty,question,options,correct_index) values
('Concentrazione','easy','Qual è il modo migliore per iniziare?','["Aprire le notifiche","Scegliere una sola attività","Cambiare attività spesso","Controllare i social"]',1),
('Concentrazione','medium','Cosa riduce meglio le interruzioni durante il Focus?','["Multitasking","Notifiche attive","Bloccare le distrazioni","Cambiare obiettivo"]',2),
('Concentrazione','hard','Quale strategia protegge meglio il lavoro profondo?','["Contesto stabile e intenzione esplicita","Più app aperte","Controlli frequenti","Task casuali"]',0),
('Pianificazione','easy','Come si rende utile un obiettivo grande?','["Lasciandolo generico","Dividendo in azioni concrete","Aspettando la motivazione","Facendo tutto subito"]',1),
('Pianificazione','medium','Cosa dovrebbe avere una buona missione?','["Un risultato verificabile","Solo una scadenza","Nessun limite","Molte attività insieme"]',0),
('Pianificazione','hard','Qual è il criterio migliore per ordinare le missioni?','["Impatto sull obiettivo e vincoli","Solo facilità","Solo durata","Ordine casuale"]',0),
('Costanza','easy','Cosa costruisce un abitudine?','["Piccoli comportamenti ripetuti","Perfezione","Saltare i giorni difficili","Cambiare metodo ogni giorno"]',0),
('Costanza','medium','Cosa aiuta dopo un giorno saltato?','["Abbandonare","Riprendere dal prossimo passo","Raddoppiare tutto","Ignorare il piano"]',1),
('Costanza','hard','Quale comportamento rende una streak più robusta?','["Attività reale e verificabile","Aprire l app","Guardare statistiche","Cambiare avatar"]',0),
('Priorità','easy','Quale attività viene prima?','["Quella con maggior impatto","Quella più facile","Tutte insieme","Quella più rumorosa"]',0),
('Priorità','medium','Come gestire due missioni importanti?','["Valutare impatto e urgenza","Farle entrambe contemporaneamente","Sceglierne una a caso","Rimandarle entrambe"]',0),
('Priorità','hard','Qual è una buona regola quando il tempo è scarso?','["Proteggere il passo ad alto impatto","Aggiungere attività","Eliminare il Focus","Cambiare obiettivo"]',0),
('Autovalutazione','easy','Perché misurare una skill?','["Per capire dove migliorare","Per giudicarsi","Per evitare pratica","Per confrontarsi"]',0),
('Autovalutazione','medium','Cosa indica una mastery bassa?','["Serve più pratica mirata","Il percorso è inutile","Bisogna saltare il quiz","Serve più tempo online"]',0),
('Autovalutazione','hard','Come dovrebbe reagire il sistema a errori ripetuti?','["Adattare difficoltà e pratica","Aumentare casualmente la difficoltà","Ignorarli","Premiare ugualmente"]',0)
on conflict do nothing;
