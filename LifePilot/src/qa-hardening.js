const bannerId = 'lp-network-banner';
let hideTimer = null;

const getBanner = () => {
  let el = document.getElementById(bannerId);
  if (el) return el;
  el = document.createElement('div');
  el.id = bannerId;
  el.className = 'lp-network-banner';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.hidden = true;
  document.body.appendChild(el);
  return el;
};

const setNetworkState = (online) => {
  const el = getBanner();
  window.clearTimeout(hideTimer);
  if (!online) {
    el.textContent = 'Connessione assente. Le modifiche verranno riprese quando torni online.';
    el.dataset.state = 'offline';
    el.hidden = false;
    return;
  }
  if (el.dataset.state === 'offline') {
    el.textContent = 'Connessione ripristinata.';
    el.dataset.state = 'online';
    el.hidden = false;
    hideTimer = window.setTimeout(() => { el.hidden = true; }, 2200);
  }
};

const onOnline = () => setNetworkState(true);
const onOffline = () => setNetworkState(false);

window.addEventListener('online', onOnline);
window.addEventListener('offline', onOffline);

if (typeof navigator !== 'undefined' && navigator.onLine === false) setNetworkState(false);

export const stopQaHardening = () => {
  window.removeEventListener('online', onOnline);
  window.removeEventListener('offline', onOffline);
  window.clearTimeout(hideTimer);
  document.getElementById(bannerId)?.remove();
};
