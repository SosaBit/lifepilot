import React from 'react';
import {createRoot} from 'react-dom/client';
import './boot-recovery.js';
import './boot-timeout.js';
import LifePilotV2 from './lifepilot-v2.jsx';
import OnboardingGate from './onboarding-gate.jsx';
import MobileBottomNav from './mobile-bottom-nav.jsx';
import './lifepilot-v2.css';
import './lifepilot-polish.css';
import './lifepilot-launch-polish.css';
import './sidebar-fix.css';
import './qa-hardening.js';
import './qa-hardening.css';
import './billing-enhancer.js';
import './admin-enhancer.js';
import './ux-navigation-bridge.js';
import './functional-polish.js';
import './quiz-rewards.js';
import './quiz-system-v2.js';
import './logout-fix.js';
import Landing from './landing.jsx';
import {startAnalytics} from './analytics.js';

const stopAnalytics=startAnalytics();
const isAppPath=window.location.pathname==='/app'||window.location.pathname.startsWith('/app/');
const AppShell=()=>isAppPath?<OnboardingGate><LifePilotV2/><MobileBottomNav/></OnboardingGate>:<Landing/>;
class AppErrorBoundary extends React.Component{constructor(p){super(p);this.state={error:null}}static getDerivedStateFromError(error){return{error}}componentDidCatch(error,info){console.error('LifePilot render error',error,info)}render(){if(this.state.error)return <div className="lp-splash"><div className="lp-logo"><span>✦</span></div><h1>LifePilot</h1><p>Si è verificato un problema temporaneo.</p><button className="primary" onClick={()=>window.location.reload()}>Riprova</button></div>;return this.props.children}}
createRoot(document.getElementById('root')).render(<AppErrorBoundary><AppShell/></AppErrorBoundary>);
if(import.meta.hot)import.meta.hot.dispose(stopAnalytics);
