import React,{lazy,Suspense} from 'react';
import { createRoot } from 'react-dom/client';
import './lifepilot-v2.css';
import './lifepilot-polish.css';
import './quiz-abilities.js';

const LifePilotV2=lazy(()=>import('./lifepilot-v2.jsx'));

function AppLoading(){
  return <div className="lp-splash"><div className="lp-logo"><span>✦</span></div><h1>LifePilot</h1><p>Prepariamo il tuo percorso…</p></div>;
}

createRoot(document.getElementById('root')).render(
  <Suspense fallback={<AppLoading/>}>
    <LifePilotV2 />
  </Suspense>
);