export const NAV_ITEMS = [
  { key: 'home', label: 'Home', mobile: true },
  { key: 'plan', label: 'Il mio piano', mobile: true },
  { key: 'goals', label: 'Obiettivi', mobile: false },
  { key: 'focus', label: 'Focus', mobile: true },
  { key: 'gameplay', label: 'Gameplay', mobile: true },
  { key: 'quiz', label: 'Quiz & Abilità', mobile: true },
  { key: 'progress', label: 'Progressi', mobile: false },
  { key: 'notifications', label: 'Notifiche', mobile: false },
  { key: 'profile', label: 'Profilo', mobile: false }
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(item => item.mobile);

export const isKnownRoute = key => NAV_ITEMS.some(item => item.key === key);
