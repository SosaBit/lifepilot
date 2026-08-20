import { supabase } from './lib/supabase';

const SETTINGS_GEAR = '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1.0H6v-2.6h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4h2.6v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.6 1Z"/>';

const STYLE = `
.pageicon.settings-fixed,.staticon.settings-fixed{display:grid!important;place-items:center!important;overflow:hidden!important}
svg.settings-fixed{width:21px!important;height:21px!important;stroke-width:2!important;transform:none!important;display:block!important}
.dashboard-head h1{max-width:100%;overflow-wrap:anywhere;word-break:break-word;letter-spacing:-.025em!important}
.dashboard-head p{max-width:720px;margin-top:8px!important}
.date-line{white-space:normal!important;line-height:1.35!important}
.lp-profile-extra{margin-top:16px}
.lp-profile-extra .info-item{min-height:48px}
@media(max-width:800px){
 .dashboard-head h1{font-size:31px!important;line-height:1.05!important}
 .dashboard-head p{font-size:15px!important;line-height:1.45!important}
 .date-line{font-size:11px!important}
}
@media(max-width:420px){.dashboard-head h1{font-size:28px!important}.hero h2{font-size:24px!important}}
`;

function style(){
 if(document.getElementById('lifepilot-final-fixes-style')) return;
 const s=document.createElement('style');s.id='lifepilot-final-fixes-style';s.textContent=STYLE;document.head.appendChild(s);
}

function fixSettingsIcons(){
 document.querySelectorAll('.pageicon .icon,.staticon .icon,.nav .icon,.bottomnav .icon').forEach(svg=>{
   const page=svg.closest('.pagehead');
   const looksSettings=page?.querySelector('h1')?.textContent?.trim()==='Impostazioni' ||
     svg.closest('.nav')?.textContent?.includes('Impostazioni') ||
     svg.closest('.bottomnav')?.textContent?.includes('Impost.');
   if(!looksSettings) return;
   svg.innerHTML=SETTINGS_GEAR;
   svg.classList.add('settings-fixed');
 });
}

function userPreferenceKey(userId){return `lifepilot-user-prefs-${userId}`}
async function isolateAccountPreferences(){
 try{
   if(!supabase) return;
   const {data:{user}}=await supabase.auth.getUser();
   if(!user) return;
   const key=userPreferenceKey(user.id);
   const prefs=JSON.parse(localStorage.getItem(key)||'{}');
   ['lifepilot-nickname','lifepilot-notifications','lifepilot-sounds','lifepilot-reduced-motion'].forEach(k=>localStorage.removeItem(k));
   if(prefs.nickname){
     const h=[...document.querySelectorAll('h1')].find(x=>x.textContent.includes('Buongiorno,'));
     if(h) h.textContent=`Buongiorno, ${prefs.nickname}.`;
   }
   localStorage.setItem('lifepilot-active-user',user.id);
 }catch{}
}

function enhanceDashboardDate(){
 const line=document.querySelector('.date-line');
 if(!line || line.dataset.finalDate==='1') return;
 line.dataset.finalDate='1';
 const update=()=>{
   const now=new Date();
   const date=new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
   line.textContent='';
   const icon=document.createElement('span');icon.textContent='📅';icon.setAttribute('aria-hidden','true');
   line.append(icon,document.createTextNode(date));
   line.title=`Ora del dispositivo: ${new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(now)}`;
 };
 update();
 const id=setInterval(update,60000);
 window.addEventListener('pagehide',()=>clearInterval(id),{once:true});
}

function addProfileContext(){
 const h1=[...document.querySelectorAll('h1')].find(x=>x.textContent.trim()==='Profilo');
 if(!h1 || document.getElementById('lp-profile-extra')) return;
 const panel=h1.closest('.panel');
 if(!panel) return;
 const extra=document.createElement('div');extra.id='lp-profile-extra';extra.className='panel lp-profile-extra';
 const now=new Date();
 const locale=navigator.language||'it-IT';
 const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'Locale dispositivo';
 const platform=navigator.userAgentData?.platform||navigator.platform||'Dispositivo';
 extra.innerHTML=`<div class="setting-title">Informazioni personali</div><div class="info-list"><div class="info-item"><span>Lingua</span><span>${locale}</span></div><div class="info-item"><span>Fuso orario</span><span>${tz}</span></div><div class="info-item"><span>Dispositivo</span><span>${platform}</span></div><div class="info-item"><span>Data locale</span><span>${new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric'}).format(now)}</span></div></div>`;
 panel.parentElement.insertBefore(extra,panel.nextSibling);
}

style();
const run=()=>{fixSettingsIcons();enhanceDashboardDate();addProfileContext();isolateAccountPreferences();};
run();
new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
