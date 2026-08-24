import React from 'react';

/** Single navigation contract for the refactor. Pages can be migrated behind this boundary without changing the shell. */
export const ROUTES = Object.freeze({
  home:'home', plan:'plan', goals:'goals', focus:'focus', gameplay:'gameplay', quiz:'quiz', progress:'progress', notifications:'notifications', profile:'profile'
});

export const routeFromLegacyLabel = (label='') => {
  const t=String(label).trim().toLowerCase();
  if(t==='home') return ROUTES.home;
  if(t==='il mio piano'||t==='piano') return ROUTES.plan;
  if(t==='obiettivi') return ROUTES.goals;
  if(t==='focus') return ROUTES.focus;
  if(t.startsWith('gameplay')) return ROUTES.gameplay;
  if(t.startsWith('quiz')) return ROUTES.quiz;
  if(t==='progressi') return ROUTES.progress;
  if(t==='notifiche') return ROUTES.notifications;
  if(t==='profilo') return ROUTES.profile;
  return ROUTES.home;
};

export default function AppRouter({children}){ return <>{children}</>; }
