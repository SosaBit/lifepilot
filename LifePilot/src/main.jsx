import React,{lazy,Suspense} from 'react';
import { createRoot } from 'react-dom/client';
import './lifepilot-v2.css';
import './lifepilot-polish.css';

const LifePilotV2=lazy(()=>import('./lifepilot-v2.jsx'));

function AppLoading(){
  return <div className="lp-splash"><div className="lp-logo"><span>✦</span></div><h1>LifePilot</h1><p>Prepariamo il tuo percorso…</p></div>;
}

// Canonical LifePilot v2 entrypoint. The application bundle is loaded on demand
// so the initial JS payload stays small and the public landing can remain fast.
createRoot(document.getElementById('root')).render(
  <Suspense fallback={<AppLoading/>}>
    <LifePilotV2 />
  </Suspense>
);