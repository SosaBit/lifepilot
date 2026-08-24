import React from 'react';

export const ROUTES=Object.freeze({home:'home',plan:'plan',goals:'goals',focus:'focus',gameplay:'gameplay',quiz:'quiz',progress:'progress',notifications:'notifications',profile:'profile'});
export const routeFromPath=(path=window.location.pathname)=>{const p=String(path).replace(/^\/app\/?/,'').replace(/\/$/,'');if(!p)return ROUTES.home;const base=p.split('/')[0];return Object.values(ROUTES).includes(base)?base:ROUTES.home};
export const pathForRoute=(route='home')=>route===ROUTES.home?'/app':`/app/${route}`;
export const routeFromLegacyLabel=(label='')=>{const t=String(label).trim().toLowerCase();if(t==='home')return ROUTES.home;if(t==='il mio piano'||t==='piano')return ROUTES.plan;if(t==='obiettivi')return ROUTES.goals;if(t==='focus')return ROUTES.focus;if(t.startsWith('gameplay'))return ROUTES.gameplay;if(t.startsWith('quiz'))return ROUTES.quiz;if(t==='progressi')return ROUTES.progress;if(t==='notifiche')return ROUTES.notifications;if(t==='profilo')return ROUTES.profile;return Object.values(ROUTES).includes(t)?t:ROUTES.home};
export default function AppRouter({children}){return <>{children}</>}
