-- Final ACL pass: no client writes to server-generated challenges/missions or mission completion state.
revoke insert,update,delete on public.life_challenges,public.life_missions from public,anon,authenticated;
revoke update on public.goal_tasks from public,anon,authenticated;
revoke all on table public.profiles,public.goals,public.goal_tasks,public.life_sessions,public.life_missions,public.life_challenges,public.quiz_attempts,public.quiz_results,public.reward_ledger,public.skill_progress,public.life_xp_ledger,public.life_user_achievements,public.user_achievements,public.life_quiz_passes,public.life_shop_redemptions,public.life_user_shop_items from anon;
