import React from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,Check,Sparkles,Target,Timer,TrendingUp} from 'lucide-react';
import './landing.css';

const goApp=()=>{window.location.href='/app'};

export default function Landing(){return <div className="landing">
  <header className="landing-nav"><div className="landing-brand"><span><Sparkles/></span>LifePilot</div><button className="landing-login" onClick={goApp}>Accedi</button></header>
  <main>
    <section className="landing-hero"><div className="landing-copy"><span className="eyebrow">IL TUO PIANO PERSONALE</span><h1>Trasforma i tuoi obiettivi in <em>azioni quotidiane.</em></h1><p>LifePilot ti aiuta a scegliere cosa conta, trasformarlo in passi concreti e mantenere il ritmo ogni giorno.</p><div className="landing-actions"><button className="primary landing-cta" onClick={goApp}>Inizia gratis <ArrowRight size={18}/></button><a href="#come-funziona">Scopri come funziona</a></div><div className="landing-trust"><Check size={16}/> Piano personale · Focus · Progressi</div></div><div className="landing-preview"><div className="preview-top"><span>OGGI</span><b>Il prossimo passo</b></div><div className="preview-goal"><Target/><div><small>OBIETTIVO</small><strong>Costruire una routine migliore</strong></div></div><div className="preview-task done"><Check/><span>Definisci le 3 priorità di oggi</span></div><div className="preview-task"><span className="dot"/><span>25 minuti di lavoro concentrato</span></div><div className="preview-task"><span className="dot"/><span>Fai il punto sui progressi</span></div></div></section>
    <section id="come-funziona" className="landing-section"><span className="eyebrow">COME FUNZIONA</span><h2>Un sistema semplice per andare avanti.</h2><div className="feature-grid"><Feature icon={<Target/>} title="Obiettivi" text="Definisci ciò che vuoi davvero raggiungere e mantieni il focus."/><Feature icon={<Check/>} title="Azioni" text="Trasforma ogni obiettivo in passi quotidiani concreti e misurabili."/><Feature icon={<Timer/>} title="Focus" text="Dedica tempo protetto alle attività che fanno la differenza."/><Feature icon={<TrendingUp/>} title="Progressi" text="Guarda cosa hai fatto, costruisci continuità e continua a migliorare."/></div></section>
    <section className="landing-pro"><div><span className="eyebrow">LIFEPILOT PRO</span><h2>Più struttura quando vuoi fare sul serio.</h2><p>Piani personalizzati, strumenti avanzati e un'esperienza pensata per trasformare la costanza in risultati.</p></div><button className="primary" onClick={goApp}>Prova LifePilot <ArrowRight size={18}/></button></section>
    <section className="landing-section landing-final"><h2>Il prossimo passo è il più importante.</h2><p>Inizia gratis e costruisci il tuo percorso, un giorno alla volta.</p><button className="primary landing-cta" onClick={goApp}>Inizia gratis <ArrowRight size={18}/></button></section>
  </main>
  <footer><span>© LifePilot</span><div><a href="/privacy.html">Privacy</a><a href="/terms.html">Termini</a></div></footer>
</div>}
function Feature({icon,title,text}){return <article className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>}

if(document.getElementById('landing-root')) createRoot(document.getElementById('landing-root')).render(<Landing/>);
