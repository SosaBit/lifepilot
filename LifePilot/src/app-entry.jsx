import React from 'react';
import { createRoot } from 'react-dom/client';
import LifePilotV2 from './lifepilot-v2.jsx';
import './lifepilot-v2.css';
import './billing-enhancer.js';
import './admin-enhancer.js';

createRoot(document.getElementById('root')).render(<LifePilotV2 />);
