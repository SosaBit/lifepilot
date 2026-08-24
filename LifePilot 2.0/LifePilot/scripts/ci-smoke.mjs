import { readFile } from 'node:fs/promises'
const files=['index.html','src/main.jsx','src/lifepilot-v2.jsx','src/lifepilot-v2.css','src/lib/supabase.js','public/manifest.webmanifest','public/sw.js']
for(const f of files){const s=await readFile(f,'utf8');if(!s.trim())throw new Error(`${f} is empty`)}
const app=await readFile('src/lifepilot-v2.jsx','utf8')
const required=['Auth','ProfileSetup','Plan','Goals','Calendar','Focus','Progress','Notifications','Profile','generate-plan','focus_sessions','goal_tasks']
for(const x of required)if(!app.includes(x))throw new Error(`Missing capability ${x}`)
console.log('LifePilot smoke checks passed')
