import React from 'react';
import { createRoot } from 'react-dom/client';
import LifePilotV2 from './lifepilot-v2.jsx';
import './lifepilot-v2.css';

// Canonical LifePilot v2 entrypoint: legacy runtime scripts are intentionally not imported here.
createRoot(document.getElementById('root')).render(<LifePilotV2 />);
