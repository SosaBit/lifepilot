import React from 'react';
import {createRoot} from 'react-dom/client';
import './boot-recovery.js';
import './boot-timeout.js';
import LifePilotV2 from './lifepilot-v2.jsx';
import OnboardingGate from './onboarding-gate.jsx';
import './lifepilot-v2.css';
import './billing-enhancer.js';
import './admin-enhancer.js';
import Landing from './landing.jsx';
import {startAnalytics} from './analytics.js';

const stopAnalytics=startAnalytics();
const isAppPath=window.location.pathname==='/app'||window.location.pathname.startsWith('/app/');
createRoot(document.getElementById('root')).render(isAppPath?<OnboardingGate><LifePilotV2/></OnboardingGate>:<Landing/>);
if(import.meta.hot)import.meta.hot.dispose(stopAnalytics);
