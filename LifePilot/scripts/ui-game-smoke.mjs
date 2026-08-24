import fs from 'node:fs/promises'

const read=async p=>fs.readFile(p,'utf8')
const entry=await read('src/app-entry.jsx')
const chrome=await read('src/game-chrome.jsx')
const shell=await read('src/lifepilot-gate.jsx')
const checks=[
 ['GameChrome mounted',entry.includes("<GameChrome/>")],
 ['sidebar navigation',shell.includes('<aside className="lp-side">')],
 ['logout action',shell.includes('supabase.auth.signOut()')],
 ['mobile navigation',shell.includes('mobile-bottom-nav')],
 ['avatar persistence',chrome.includes("update({avatar_key:key})")],
 ['level HUD',chrome.includes('game-level-block')],
 ['LifeCoins HUD',chrome.includes('game-coins')],
 ['character forge',chrome.includes('CHARACTER FORGE')],
 ['all avatar keys',chrome.includes("'nova'")&&chrome.includes("'dragon'")&&chrome.includes("'knight'")],
]
for(const [name,ok] of checks) if(!ok) throw new Error(`UI/game smoke failed: ${name}`)
console.log(`UI/game smoke: PASS (${checks.length} invariants)`)
