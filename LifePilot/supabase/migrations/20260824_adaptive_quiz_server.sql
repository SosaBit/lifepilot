-- Server-driven adaptive quiz: answers never leave the database.
create table if not exists public.quiz_bank (
  id uuid primary key default gen_random_uuid(),
  skill text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  question text not null,
  options jsonb not null check (jsonb_typeof(options)='array'),
  correct_index integer not null check (correct_index >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists quiz_bank_skill_difficulty_idx on public.quiz_bank(skill,difficulty) where active;
alter table public.quiz_bank enable row level security;
revoke all on table public.quiz_bank from anon,authenticated;

insert into public.quiz_bank(skill,difficulty,question,options,correct_index) values
('Concentrazione','easy','Qual è il modo migliore per iniziare una sessione?','["Aprire le notifiche","Scegliere una sola attività","Cambiare attività spesso","Controllare i social"]',1),
('Concentrazione','medium','Cosa riduce meglio le interruzioni durante il Focus?','["Multitasking","Notifiche attive","Bloccare le distrazioni","Cambiare obiettivo"]',2),
('Concentrazione','hard','Quale strategia protegge meglio il lavoro profondo?','["Contesto stabile e intenzione esplicita","Più app aperte","Controlli frequenti","Task casuali"]',0),
('Pianificazione','easy','Come si rende utile un obiettivo grande?','["Lasciandolo generico","Dividendo in azioni concrete","Aspettando la motivazione","Facendo tutto subito"]',1),
('Pianificazione','medium','Cosa dovrebbe avere una buona missione?','["Un risultato verificabile","Solo una scadenza","Nessun limite","Molte attività insieme"]',0),
('Pianificazione','hard','Qual è il criterio migliore per ordinare le missioni?','["Impatto sull’obiettivo e vincoli","Solo facilità","Solo durata","Ordine casuale"]',0),
('Costanza','easy','Cosa costruisce un’abitudine?','["Piccoli comportamenti ripetuti","Perfezione","Saltare i giorni difficili","Cambiare metodo ogni giorno"]',0),
('Costanza','medium','Cosa aiuta dopo un giorno saltato?','["Abbandonare","Riprendere dal prossimo passo","Raddoppiare tutto","Ignorare il piano"]',1),
('Costanza','hard','Quale comportamento rende una streak più robusta?','["Attività reale e verificabile","Aprire l’app","Guardare statistiche","Cambiare avatar"]',0),
('Priorità','easy','Quale attività viene prima?','["Quella con maggior impatto","Quella più facile","Tutte insieme","Quella più rumorosa"]',0),
('Priorità','medium','Come gestire due missioni importanti?','["Valutare impatto e urgenza","Farle entrambe contemporaneamente","Sceglierne una a caso","Rimandarle entrambe"]',0),
('Priorità','hard','Qual è una buona regola quando il tempo è scarso?','["Proteggere il passo ad alto impatto","Aggiungere attività","Eliminare il Focus","Cambiare obiettivo"]',0)
ON CONFLICT DO NOTHING;

create or replace function public.get_adaptive_quiz(p_session_id uuid,p_goal_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if not exists(select 1 from public.life_sessions where id=p_session_id and user_id=uid and goal_id=p_goal_id and status='active') then raise exception 'Invalid active session'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'skill',q.skill,'difficulty',q.difficulty,'question',q.question,'options',q.options) order by q.skill), '[]'::jsonb)
 into result from (
   select distinct on (q.skill) q.id,q.skill,q.difficulty,q.question,q.options
   from public.quiz_bank q
   left join public.skill_progress s on s.user_id=uid and s.skill=q.skill
   where q.active and q.difficulty=case when coalesce(s.mastery,0)<40 then 'easy' when coalesce(s.mastery,0)<70 then 'medium' else 'hard' end
   order by q.skill,q.created_at desc
 ) q;
 return result;
end; $$;

grant execute on function public.get_adaptive_quiz(uuid,uuid) to authenticated;

create or replace function public.submit_adaptive_quiz(p_session_id uuid,p_goal_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); total integer; score integer; passed boolean; skills text[]; attempt_id uuid; reward jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 if not exists(select 1 from public.life_sessions where id=p_session_id and user_id=uid and goal_id=p_goal_id and status='active') then raise exception 'Invalid active session'; end if;
 if jsonb_typeof(p_answers)<>'array' then raise exception 'Invalid answers'; end if;
 select count(*),coalesce(sum(case when (a->>'answer')::integer=q.correct_index then 1 else 0 end),0),array_agg(distinct q.skill)
 into total,score,skills
 from jsonb_array_elements(p_answers) a join public.quiz_bank q on q.id=(a->>'question_id')::uuid and q.active;
 if total=0 then raise exception 'No valid quiz answers'; end if;
 passed:=score*100>=total*60;
 select (public.record_quiz_result('adaptive:'||p_session_id::text,p_goal_id,p_session_id,score,total,skills))->'xp' into reward;
 return jsonb_build_object('passed',passed,'score',score,'total',total,'skills',skills,'xp',coalesce((reward)::int,0));
end; $$;

grant execute on function public.submit_adaptive_quiz(uuid,uuid,jsonb) to authenticated;
