import { access, readFile } from 'node:fs/promises'

const required = [
  'index.html',
  'vercel.json',
  'scripts/write-version.mjs',
  'public/live-update.js',
  'src/lib/supabase.js',
  'src/services/realtime.js',
  'src/live-content-bridge.js',
  'src/admin-console.js',
]

for (const file of required) await access(file)
const index = await readFile('index.html', 'utf8')
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
if (!index.includes('/src/live-content-bridge.js')) throw new Error('Live content bridge is not wired')
if (!index.includes('/src/admin-console.js')) throw new Error('Admin console is not wired')
if (!pkg.scripts?.build?.includes('write-version.mjs')) throw new Error('Version manifest is not part of build')
console.log(`LifePilot live system OK: ${required.length} source files present`)
