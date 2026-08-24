alter table public.life_achievements enable row level security;
drop policy if exists "achievements are readable" on public.life_achievements;
create policy "achievements are readable" on public.life_achievements for select using (true);
drop policy if exists "users read own quiz passes" on public.life_quiz_passes;
create policy "users read own quiz passes" on public.life_quiz_passes for select using (auth.uid()=user_id);
