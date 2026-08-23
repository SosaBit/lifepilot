import React from 'react';
import {createRoot} from 'react-dom/client';
import './boot-recovery.js';
import './boot-timeout.js';
import LifePilotV2 from './lifepilot-v2.jsx';
import './lifepilot-v2.css';
import './ui-redesign-v3.css';
import './billing-enhancer.js';
import './admin-enhancer.js';
import Landing from './landing.jsx';
import {startAnalytics} from './analytics.js';

const stopAnalytics=startAnalytics();
const isAppPath=window.location.pathname==='/app'||window.location.pathname.startsWith('/app/');
createRoot(document.getElementById('root')).render(isAppPath?<LifePilotV2/>:<Landing/>);
if(import.meta.hot)import.meta.hot.dispose(stopAnalytics);
