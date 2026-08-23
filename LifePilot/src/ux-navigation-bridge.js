const resolveNavButton = (key) => {
  const labels = {
    home: ['Home'],
    plan: ['Il mio piano', 'Piano'],
    goals: ['Obiettivi'],
    calendar: ['Calendario'],
    focus: ['Focus'],
    progress: ['Progressi'],
    notifications: ['Notifiche'],
    profile: ['Profilo']
  };
  const wanted = labels[key] || [];
  if (!wanted.length) return null;
  const buttons = [...document.querySelectorAll('.lp-side .nav button, .lp-drawer .nav button')];
  return buttons.find((button) => wanted.some((label) => button.textContent.trim().startsWith(label))) || null;
};

const navigate = (key) => {
  const button = resolveNavButton(key);
  if (button) {
    button.click();
    return true;
  }
  return false;
};

const onNavigate = (event) => {
  const key = event?.detail;
  if (typeof key !== 'string') return;
  if (!navigate(key)) {
    window.setTimeout(() => navigate(key), 120);
  }
};

const onKeyDown = (event) => {
  if (event.key !== 'Escape') return;
  const drawer = document.querySelector('.drawer-bg');
  if (drawer) drawer.click();
};

window.addEventListener('lifepilot:navigate', onNavigate);
window.addEventListener('keydown', onKeyDown);

export const stopNavigationBridge = () => {
  window.removeEventListener('lifepilot:navigate', onNavigate);
  window.removeEventListener('keydown', onKeyDown);
};
