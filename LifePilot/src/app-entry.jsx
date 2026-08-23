import React from 'react';
import {createRoot} from 'react-dom/client';
import './boot-recovery.js';
import './boot-timeout.js';
import LifePilotV2 from './lifepilot-v2.jsx';
import OnboardingGate from './onboarding-gate.jsx';
import MobileBottomNav from './mobile-bottom-nav.jsx';
import './lifepilot-v2.css';
import './billing-enhancer.js';
import './admin-enhancer.js';
import Landing from './landing.jsx';
import {startAnalytics} from './analytics.js';

const stopAnalytics=startAnalytics();
const isAppPath=window.location.pathname==='/app'||window.location.pathname.startsWith('/app/');
const AppShell=()=>isAppPath?<OnboardingGate><LifePilotV2/><MobileBottomNav/></OnboardingGate>:<Landing/>;
createRoot(document.getElementById('root')).render(<AppShell/>);
if(import.meta.hot)import.meta.hot.dispose(stopAnalytics);
