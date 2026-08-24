# LifePilot 2.0 — Brainstorming 1–12 completion package

This package continues the LifePilot refactor from the supplied repository snapshot.

## Implemented in this package
1. Adaptive Quiz: difficulty selected from per-skill mastery.
2. Gameplay Loop: Goal → Plan → Mission → Focus → Quiz → Reward → Progression.
3. Skill Tree/mastery: quiz results update skill mastery.
4. Intelligent streak: real task/focus/quiz activity updates streak.
5. LifeCoins economy: server-side shop redemption with idempotent ownership.
6. Player progression: XP/level/title progression.
7. Achievements: existing progression infrastructure retained and surfaced.
8. Dashboard: daily-first "Cosa devo fare oggi?" flow retained.
9. AI Coach: new Supabase Edge Function using Gemini when configured, with deterministic fallback.
10. Weekly challenges: existing challenge infrastructure surfaced and progressed.
11. Evolutionary profile: level, XP, streak, skills, mastery, achievements and LifeCoins.
12. Anti-cheat: server-side focus duration, goal/session binding, reward idempotency and duplicate protection.

## Important deployment step
The repository can be prepared locally, but this uploaded ZIP cannot itself deploy to Vercel/Supabase. Apply the new Supabase migration and deploy the new `ai-coach` Edge Function, then run the existing CI/build and production verification.

The package deliberately does not claim production completion until those external deployment steps are executed.
