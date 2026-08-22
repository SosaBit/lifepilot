import React from 'react';
import { createRoot } from 'react-dom/client';
import './boot-recovery.js';
import './boot-timeout.js';
import LifePilotV2 from './lifepilot-v2.jsx';
import './lifepilot-v2.css';
import './billing-enhancer.js';
import './admin-enhancer.js';

// Canonical production entrypoint. Boot watchdogs run independently of React/Supabase
// so an authentication hang can never leave the user on an infinite loading screen.
createRoot(document.getElementById('root')).render(<LifePilotV2 />);
