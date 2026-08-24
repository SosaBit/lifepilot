import { supabase } from './lib/supabase';

function ensure(){
  document.querySelectorAll('.lp-side .nav,.lp-drawer .nav').forEach(nav=>{
    if(nav.querySelector('[data-lp-logout]')) return;
    const b=document.createElement('button');b.type='button';b.dataset.lpLogout='1';b.className='lp-nav-logout';b.innerHTML='<span aria-hidden="true">↪</span><span>Esci</span>';
    b.onclick=async()=>{b.disabled=true;b.querySelector('span:last-child').textContent='Uscita…';const {error}=await supabase.auth.signOut();if(error){b.disabled=false;b.querySelector('span:last-child').textContent='Esci';alert(error.message)}};
    nav.appendChild(b);
  });
}
function style(){if(document.getElementById('lp-logout-fix-style'))return;const s=document.createElement('style');s.id='lp-logout-fix-style';s.textContent=`
.lp-side .nav,.lp-drawer .nav{padding-bottom:8px!important}.lp-side .nav [data-lp-logout],.lp-drawer .nav [data-lp-logout]{display:flex!important;box-sizing:border-box!important;width:100%!important;min-height:40px!important;height:40px!important;flex:0 0 40px!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;margin:2px 0!important;padding:0 11px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#7f8b99!important;font:inherit!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;visibility:visible!important;opacity:1!important}.lp-side .nav [data-lp-logout]:hover,.lp-drawer .nav [data-lp-logout]:hover{background:var(--surface-2)!important;color:var(--text)!important}.lp-side>.logout,.lp-drawer>.logout{display:none!important}
`;document.head.appendChild(s)}
function start(){style();ensure();new MutationObserver(ensure).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
