import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('supabase/migrations');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.sql')).map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const required=[
  'revoke insert,update,delete on public.skill_progress',
  'revoke insert, update, delete on public.reward_ledger',
  'revoke insert,update,delete on public.life_xp_ledger',
  'revoke insert,update,delete on public.life_challenges',
  'revoke update on public.goal_tasks',
  'submit_adaptive_quiz',
  'create_focus_session',
  'gameplay_events',
  'set_user_timezone'
];
for(const marker of required){if(!files.includes(marker))throw new Error(`Missing gameplay security invariant: ${marker}`)}
console.log(`Gameplay security smoke: PASS (${required.length} invariants)`);
