import { readFile } from 'node:fs/promises'

const files = [
  'index.html',
  'src/app-entry.jsx',
  'src/lifepilot-gate.jsx',
  'src/lifepilot-v2.css',
  'src/lib/supabase.js',
  'public/manifest.webmanifest',
  'public/sw.js',
]

for (const file of files) {
  const source = await readFile(file, 'utf8')
  if (!source.trim()) throw new Error(`${file} is empty`)
}

const app = await readFile('src/lifepilot-gate.jsx', 'utf8')
const required = ['LifePilotGate','Login','Dashboard','Plan','Goals','Focus','AdaptiveQuiz','Gameplay','Progress','Coach','Challenge','Shop','Profile','MobileNav']
for (const capability of required) {
  if (!app.includes(capability)) throw new Error(`Missing gameplay capability: ${capability}`)
}

console.log(`LifePilot smoke checks passed (${required.length} gameplay capabilities)`)
