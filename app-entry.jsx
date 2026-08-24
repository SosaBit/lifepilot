import React from 'react';
import {createRoot} from 'react-dom/client';
import './boot-recovery.js';
import './boot-timeout.js';
import OnboardingGate from './onboarding-gate.jsx';
import AppShell from './app/AppShell.jsx';
import LifePilotCore from './lifepilot-core.jsx';
import Landing from './landing.jsx';
import {startAnalytics} from './analytics.js';
import './lifepilot-v2.css';

const stopAnalytics=startAnalytics();
const isAppPath=window.location.pathname==='/app'||window.location.pathname.startsWith('/app/');
const App=()=>isAppPath?<OnboardingGate><AppShell><LifePilotCore/></AppShell></OnboardingGate>:<Landing/>;
class AppErrorBoundary extends React.Component{constructor(p){super(p);this.state={error:null}}static getDerivedStateFromError(error){return{error}}componentDidCatch(error,info){console.error('LifePilot render error',error,info)}render(){if(this.state.error)return <div className="lp-splash"><div className="lp-logo"><span>✦</span></div><h1>LifePilot</h1><p>Si è verificato un problema temporaneo.</p><button className="primary" onClick={()=>window.location.reload()}>Riprova</button></div>;return this.props.children}}
createRoot(document.getElementById('root')).render(<AppErrorBoundary><App/></AppErrorBoundary>);
if(import.meta.hot)import.meta.hot.dispose(stopAnalytics);
