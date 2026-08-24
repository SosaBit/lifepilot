import { access, readFile } from 'node:fs/promises'
const required=['index.html','vercel.json','scripts/write-version.mjs','public/live-update.js','public/sw.js','public/manifest.webmanifest','src/app-entry.jsx','src/lifepilot-v2.jsx','src/lifepilot-v2.css','src/lib/supabase.js','supabase/schema.sql']
for(const file of required) await access(file)
const index=await readFile('index.html','utf8');const entry=await readFile('src/app-entry.jsx','utf8');const app=await readFile('src/lifepilot-v2.jsx','utf8');const pkg=JSON.parse(await readFile('package.json','utf8'))
if(!index.includes('/src/app-entry.jsx')) throw new Error('Canonical app entrypoint is not wired')
if(index.includes('/src/stable-app.jsx')||index.includes('/src/boot-timeout.js')) throw new Error('Legacy boot runtime is still wired')
if(!entry.includes('lifepilot-v2')) throw new Error('V2 app is not the canonical entrypoint')
for(const token of ['signInWithPassword','goal_tasks','focus_sessions','generate-plan']) if(!app.includes(token)) throw new Error(`Missing product capability: ${token}`)
if(!pkg.scripts?.build?.includes('write-version.mjs')) throw new Error('Version manifest is not part of build')
console.log(`LifePilot product verification OK: ${required.length} required files and core capabilities present`)
