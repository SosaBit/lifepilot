import React from 'react';

/**
 * Stable application boundary for the core migration.
 * It deliberately does not own legacy routing yet; pages can be moved here
 * incrementally without changing the current production behavior.
 */
export default function AppShell({ children }) {
  return <div className="lp-app-shell">{children}</div>;
}
