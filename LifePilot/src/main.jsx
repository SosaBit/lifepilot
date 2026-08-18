import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  HeartPulse,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Rocket,
  Settings,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  X,
} from 'lucide-react'
import './styles.css'

const STORAGE_KEY = 'lifepilot_demo_v1'

const starterGoals = [
  {
    id: 'starter-1',
    title: 'Allenarmi 3 volte a settimana',
    category: 'Fitness',
    days: 30,
    color: 'violet',
    progress: 37,
    streak: 6,
    today: [
      '25 min di allenamento',
      'Bere 2 litri d’acqua',
      'Camminare almeno 7.000 passi',
    ],
  },
]

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { goals: starterGoals, activeId: 'starter-1' }
  } catch {
    return { goals: starterGoals, activeId: 'starter-1' }
  }
}

function App() {
  const [state, setState] = useState(loadState)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [view, setView] = useState('home')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const active = useMemo(
    () => state.goals.find((g) => g.id === state.activeId) || state.goals[0],
    [state]
  )

  function setActive(id) {
    setState((s) => ({ ...s, activeId: id }))
    setView('home')
  }

  function toggleTask(index) {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === active.id
          ? {
              ...g,
              progress: Math.min(100, g.progress + 4),
              today: g.today.filter((_, i) => i !== index),
            }
          : g
      ),
    }))
  }

  function createGoal(goal) {
    const newGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      progress: 4,
      streak: 0,
      today: goal.today || [],
    }
    setState((s) => ({
      ...s,
      goals: [newGoal, ...s.goals],
      activeId: newGoal.id,
    }))
    setCreateOpen(false)
    setView('home')
  }

  const content = (
    <>
      {view === 'home' && (
        <Dashboard
          active={active}
          goals={state.goals}
          onCreate={() => setCreateOpen(true)}
          onTask={toggleTask}
          onShare={() => setShareOpen(true)}
          onChangeGoal={setActive}
        />
      )}

      {view === 'goals' && (
        <Goals
          goals={state.goals}
          activeId={state.activeId}
          onSelect={setActive}
          onCreate={() => setCreateOpen(true)}
        />
      )}

      {view === 'coach' && <Coach active={active} />}

      {view === 'progress' && <Progress active={active} goals={state.goals} />}

      {view === 'profile' && <Profile />}
    </>
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <button className="brand" onClick={() => setView('home')}>
            <span className="brand-mark"><Sparkles size={17} /></span>
            <span>LifePilot</span>
          </button>
          <div className="topbar-actions">
            <button className="icon-btn"><Bell size={19} /></button>
            <div className="avatar">A</div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div className="brand">
                <span className="brand-mark"><Sparkles size={17} /></span>
                <span>LifePilot</span>
              </div>
              <button className="icon-btn" onClick={() => setMobileOpen(false)}><X size={20}/></button>
            </div>
            <Nav view={view} setView={(v) => { setView(v); setMobileOpen(false) }} />
          </aside>
        </div>
      )}

      <div className="page-shell">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="eyebrow">Il mio spazio</div>
            <Nav view={view} setView={setView} />
          </div>

          <div className="upgrade-card">
            <div className="upgrade-icon"><Rocket size={18}/></div>
            <strong>Prova LifePilot Pro</strong>
            <p>Piani avanzati, obiettivi illimitati e coaching AI.</p>
            <button onClick={() => setShareOpen(true)}>Scopri Pro <ArrowRight size={14}/></button>
          </div>
        </aside>

        <main className="main-content">{content}</main>
      </div>

      <nav className="bottom-nav">
        <BottomNavItem icon={<Target size={20}/>} label="Oggi" active={view === 'home'} onClick={() => setView('home')} />
        <BottomNavItem icon={<BarChart3 size={20}/>} label="Progressi" active={view === 'progress'} onClick={() => setView('progress')} />
        <button className="fab" onClick={() => setCreateOpen(true)}><Plus size={25}/></button>
        <BottomNavItem icon={<MessageCircle size={20}/>} label="Coach" active={view === 'coach'} onClick={() => setView('coach')} />
        <BottomNavItem icon={<Settings size={20}/>} label="Profilo" active={view === 'profile'} onClick={() => setView('profile')} />
      </nav>

      {createOpen && (
        <CreateGoalModal onClose={() => setCreateOpen(false)} onCreate={createGoal} />
      )}

      {shareOpen && (
        <ShareModal active={active} onClose={() => setShareOpen(false)} />
      )}
    </div>
  )
}

function Nav({ view, setView }) {
  return (
    <nav className="nav-list">
      <button className={view === 'home' ? 'nav-item active' : 'nav-item'} onClick={() => setView('home')}>
        <Target size={18} /> Oggi
      </button>
      <button className={view === 'goals' ? 'nav-item active' : 'nav-item'} onClick={() => setView('goals')}>
        <Trophy size={18} /> I miei obiettivi
      </button>
      <button className={view === 'coach' ? 'nav-item active' : 'nav-item'} onClick={() => setView('coach')}>
        <MessageCircle size={18} /> Coach AI
      </button>
      <button className={view === 'progress' ? 'nav-item active' : 'nav-item'} onClick={() => setView('progress')}>
        <BarChart3 size={18} /> Progressi
      </button>
      <button className={view === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setView('profile')}>
        <Settings size={18} /> Impostazioni
      </button>
    </nav>
  )
}

function BottomNavItem({ icon, label, active, onClick }) {
  return (
    <button className={active ? 'bottom-item active' : 'bottom-item'} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  )
}

function Dashboard({ active, goals, onCreate, onTask, onShare, onChangeGoal }) {
  return (
    <div className="stack">
      <section className="hero-row">
        <div>
          <div className="eyebrow">MARTEDÌ · 18 AGOSTO</div>
          <h1>Buongiorno, Alex.</h1>
          <p>Piccoli passi oggi. Grandi risultati tra qualche settimana.</p>
        </div>
        <button className="primary-btn" onClick={onCreate}><Plus size={18}/> Nuovo obiettivo</button>
      </section>

      <section className="streak-strip">
        <div className="streak-main">
          <span className="fire"><Flame size={19}/></span>
          <div><strong>{active.streak} giorni</strong><span>di fila</span></div>
        </div>
        <div className="streak-track"><span style={{ width: `${Math.min(100, active.streak * 10)}%` }} /></div>
        <span className="streak-copy">Continua così</span>
      </section>

      <section className="goal-switcher">
        <div className="section-heading">
          <div><h2>Il tuo obiettivo</h2><p>Scegli su cosa concentrarti oggi.</p></div>
          <button className="link-btn" onClick={onCreate}>+ Aggiungi</button>
        </div>
        <div className="goal-cards">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => onChangeGoal(goal.id)}
              className={goal.id === active.id ? 'goal-card selected' : 'goal-card'}
            >
              <div className={`goal-icon ${goal.color}`}><Target size={20}/></div>
              <div className="goal-card-copy">
                <strong>{goal.title}</strong>
                <span>{goal.category} · {goal.days} giorni</span>
              </div>
              <div className="goal-progress">{goal.progress}%</div>
              <ChevronRight size={17}/>
            </button>
          ))}
        </div>
      </section>

      <section className="today-card">
        <div className="today-head">
          <div>
            <div className="eyebrow">OGGI</div>
            <h2>Una giornata alla volta.</h2>
            <p>Completa queste azioni per far avanzare il tuo percorso.</p>
          </div>
          <div className="today-ring">
            <span>{Math.max(0, 100 - active.today.length * 25)}%</span>
            <small>fatto</small>
          </div>
        </div>

        <div className="task-list">
          {active.today.length === 0 && (
            <div className="empty-state"><Check size={24}/><strong>Giornata completata!</strong><span>Domani LifePilot ti preparerà il prossimo passo.</span></div>
          )}
          {active.today.map((task, index) => (
            <label className="task" key={`${task}-${index}`}>
              <input type="checkbox" onChange={() => onTask(index)} />
              <span className="task-box"><Check size={14}/></span>
              <span className="task-copy">{task}</span>
              <span className="task-arrow">→</span>
            </label>
          ))}
        </div>

        <div className="today-footer">
          <div className="goal-bar"><span style={{width:`${active.progress}%`}} /></div>
          <div className="today-progress">{active.progress}% percorso completato</div>
        </div>
      </section>

      <section className="insight-grid">
        <article className="insight-card">
          <div className="insight-icon violet"><Sparkles size={18}/></div>
          <div><span className="eyebrow">COACH AI</span><h3>Hai 20 minuti oggi?</h3><p>Posso comprimere il piano di oggi in una versione più veloce.</p><button className="text-link">Apri Coach <ArrowRight size={14}/></button></div>
        </article>
        <article className="insight-card">
          <div className="insight-icon green"><Share2 size={18}/></div>
          <div><span className="eyebrow">CONDIVIDI</span><h3>Mostra il tuo percorso</h3><p>Crea una card con la tua streak da condividere.</p><button className="text-link" onClick={onShare}>Condividi <ArrowRight size={14}/></button></div>
        </article>
      </section>
    </div>
  )
}

function Goals({ goals, activeId, onSelect, onCreate }) {
  return (
    <div className="stack">
      <section className="hero-row">
        <div><div className="eyebrow">OBIETTIVI</div><h1>I miei obiettivi</h1><p>Costruisci più percorsi e torna ogni giorno al passo successivo.</p></div>
        <button className="primary-btn" onClick={onCreate}><Plus size={18}/> Nuovo obiettivo</button>
      </section>

      <div className="grid-2">
        {goals.map(g => (
          <button key={g.id} className={g.id === activeId ? "panel goal-panel active-panel" : "panel goal-panel"} onClick={() => onSelect(g.id)}>
            <div className={`goal-icon ${g.color}`}><Target size={20}/></div>
            <div className="goal-panel-head"><span>{g.category}</span><span>{g.progress}%</span></div>
            <h3>{g.title}</h3>
            <p>{g.days} giorni · {g.streak} giorni di streak</p>
            <div className="goal-bar"><span style={{width:`${g.progress}%`}} /></div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Coach({ active }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Sto seguendo il tuo obiettivo "${active.title}". Dimmi cosa ti blocca oggi.` },
  ])

  function send() {
    const text = message.trim()
    if (!text) return
    setMessages(m => [...m, { role: 'user', text }, { role: 'assistant', text: 'Ottimo. Riduciamo il prossimo passo: fai solo 10 minuti adesso, poi rivalutiamo.' }])
    setMessage('')
  }

  return (
    <div className="stack">
      <section className="hero-row">
        <div><div className="eyebrow">COACH AI</div><h1>Non devi fare tutto oggi.</h1><p>Usa il coach per sbloccare il prossimo passo.</p></div>
      </section>
      <section className="coach-panel">
        <div className="chat">
          {messages.map((m, i) => <div key={i} className={m.role === 'user' ? 'chat-row user' : 'chat-row'}><div className={m.role === 'assistant' ? 'chat-avatar' : 'chat-user'}>{m.role === 'assistant' ? <Sparkles size={16}/> : 'A'}</div><div className="chat-bubble">{m.text}</div></div>)}
        </div>
        <div className="chat-composer">
          <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Scrivi cosa ti sta bloccando..." />
          <button className="primary-btn icon-only" onClick={send}><ArrowRight size={18}/></button>
        </div>
      </section>
    </div>
  )
}

function Progress({ active, goals }) {
  return (
    <div className="stack">
      <section className="hero-row">
        <div><div className="eyebrow">PROGRESSI</div><h1>Stai andando avanti.</h1><p>Non serve essere perfetti. Serve continuare.</p></div>
      </section>

      <div className="stats-grid">
        <div className="stat"><span className="eyebrow">STREAK</span><strong>{active.streak}</strong><small>giorni</small></div>
        <div className="stat"><span className="eyebrow">PERCORSO</span><strong>{active.progress}%</strong><small>completato</small></div>
        <div className="stat"><span className="eyebrow">OBIETTIVI</span><strong>{goals.length}</strong><small>attivi</small></div>
      </div>

      <section className="panel chart-panel">
        <div className="section-heading"><div><h2>Andamento ultimi 14 giorni</h2><p>Un piccolo ritmo sostenibile batte gli sprint.</p></div><BarChart3 size={22} color="#6c5ce7"/></div>
        <div className="bars">
          {[35,52,40,70,58,76,88,66,78,92,84,71,95,88].map((v,i) => <div className="bar-wrap" key={i}><div className="bar" style={{height:`${v}%`}}/><span>{i+1}</span></div>)}
        </div>
      </section>
    </div>
  )
}

function Profile() {
  return (
    <div className="stack">
      <section className="hero-row"><div><div className="eyebrow">PROFILO</div><h1>Le tue preferenze.</h1><p>In questa demo salviamo i dati localmente.</p></div></section>
      <section className="panel profile-panel">
        <div className="profile-large"><div className="avatar big">A</div><div><h2>Alex</h2><p>Utente Demo</p></div></div>
        <div className="settings-row"><div><strong>Notifiche giornaliere</strong><span>Ricordami il prossimo passo alle 09:00</span></div><div className="switch on"><span/></div></div>
        <div className="settings-row"><div><strong>Modalità focus</strong><span>Riduci le distrazioni durante le attività</span></div><div className="switch"><span/></div></div>
        <div className="settings-row"><div><strong>Privacy</strong><span>I tuoi dati demo rimangono sul dispositivo</span></div><ChevronRight size={18}/></div>
      </section>
    </div>
  )
}

function CreateGoalModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Produttività')
  const [days, setDays] = useState('30')
  const [time, setTime] = useState('20')

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    const today = [
      `Dedica ${time} minuti al tuo obiettivo`,
      'Completa una micro-azione senza distrazioni',
      'Fai un check-in serale di 2 minuti',
    ]
    onCreate({ title: title.trim(), category, days: Number(days), color: categoryColor(category), today })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><div><span className="eyebrow">NUOVO OBIETTIVO</span><h2>Partiamo da un traguardo.</h2></div><button className="icon-btn" onClick={onClose}><X size={20}/></button></div>
        <form onSubmit={submit} className="form-stack">
          <label>Qual è il tuo obiettivo?<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Imparare l'inglese" /></label>
          <div className="grid-2 form-row">
            <label>Categoria<select value={category} onChange={e => setCategory(e.target.value)}><option>Fitness</option><option>Studio</option><option>Finanze</option><option>Produttività</option><option>Lingue</option><option>Lavoro</option></select></label>
            <label>Durata<select value={days} onChange={e => setDays(e.target.value)}><option value="14">14 giorni</option><option value="30">30 giorni</option><option value="60">60 giorni</option><option value="90">90 giorni</option></select></label>
          </div>
          <label>Quanto tempo hai ogni giorno?<div className="range-row"><input type="range" min="5" max="90" value={time} onChange={e => setTime(e.target.value)} /><strong>{time} min</strong></div></label>
          <div className="ai-note"><Sparkles size={17}/><div><strong>LifePilot farà il resto.</strong><span>Creeremo un piano semplice, quotidiano e adattabile.</span></div></div>
          <button className="primary-btn full" type="submit"><Rocket size={18}/> Crea il mio piano</button>
        </form>
      </div>
    </div>
  )
}

function ShareModal({ active, onClose }) {
  const share = async () => {
    const text = `🔥 ${active.streak} giorni consecutivi con LifePilot\\n🎯 ${active.progress}% del mio obiettivo completato\\n\\nSto costruendo il mio percorso un giorno alla volta.`
    if (navigator.share) {
      await navigator.share({ title: 'Il mio percorso LifePilot', text })
    } else {
      await navigator.clipboard.writeText(text)
      alert('Testo copiato. Puoi incollarlo su Instagram, TikTok o WhatsApp.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="share-card" onClick={e => e.stopPropagation()}>
        <button className="close-float" onClick={onClose}><X size={19}/></button>
        <div className="share-badge">LIFE<span>PILOT</span></div>
        <div className="share-number">{active.streak}</div>
        <div className="share-title">giorni di fila</div>
        <div className="share-progress"><span style={{width:`${active.progress}%`}}/></div>
        <div className="share-progress-label">{active.progress}% del percorso completato</div>
        <div className="share-quote">“Non serve fare tutto. Serve continuare.”</div>
        <button className="primary-btn full" onClick={share}><Share2 size={18}/> Condividi il mio progresso</button>
      </div>
    </div>
  )
}

function categoryColor(category) {
  return ({ Fitness:'green', Studio:'blue', Finanze:'gold', Produttività:'violet', Lingue:'pink', Lavoro:'indigo' }[category] || 'violet')
}

createRoot(document.getElementById('root')).render(<App />)
