import { supabase } from './lib/supabase';

const STYLE = `
:root{--lp-green:#58cc02;--lp-green-dark:#46a302;--lp-blue:#1cb0f6;--lp-purple:#6c5ce7;--lp-yellow:#ffc800;--lp-red:#ff4b4b;--lp-bg:#f7f7fb;--lp-card:#fff;--lp-ink:#202124;--lp-muted:#70727d;--lp-line:#e8e8f0;--lp-soft:#f0edff}
html,body,#root{width:100%;min-height:100%;overflow-x:hidden}
body{background:var(--lp-bg)!important;color:var(--lp-ink)!important}
button{border-radius:14px!important;transition:transform .12s ease,box-shadow .12s ease,background .12s ease!important;-webkit-tap-highlight-color:transparent}
button:active{transform:translateY(1px)}
.icon{width:20px;height:20px;display:block;flex:0 0 20px}
.brand{min-width:0!important;white-space:nowrap}
.brand .mark{width:40px!important;height:40px!important;border-radius:13px!important;background:var(--lp-purple)!important;box-shadow:0 3px 0 rgba(108,92,231,.22)!important}
.appbar{height:72px!important;padding:0 24px!important;gap:14px!important;background:#fff!important;border-bottom:2px solid var(--lp-line)!important;box-shadow:0 2px 0 rgba(32,33,36,.025)!important}
.appbar .brand{font-size:21px!important;font-weight:900!important;flex:0 1 auto!important}
.appbar .actions{display:flex!important;align-items:center!important;gap:10px!important;margin-left:auto!important;flex:0 0 auto!important}
.appbar .actions b{font-size:14px!important;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.appbar .actions .secondary{min-height:44px!important;padding:10px 14px!important;background:#fff!important;border:2px solid var(--lp-line)!important;box-shadow:0 2px 0 rgba(32,33,36,.05)!important}
.appbody{grid-template-columns:244px minmax(0,1fr)!important;min-height:calc(100vh - 72px)!important}
.side{padding:22px 14px!important;background:#fff!important;border-right:2px solid var(--lp-line)!important;gap:8px!important}
.nav{min-height:50px!important;border-radius:14px!important;padding:12px 14px!important;font-size:15px!important;font-weight:850!important;gap:12px!important;color:#70727d!important}
.nav .icon{width:21px;height:21px;stroke-width:2}
.nav.active{background:#edf9e8!important;color:var(--lp-green-dark)!important;box-shadow:inset 4px 0 0 var(--lp-green)!important}
.nav:hover{background:#f5f5f8!important;color:var(--lp-ink)!important}
.logout{border:2px solid #ffd9d9!important;background:#fff7f7!important;color:#d83b3b!important}
.main{width:100%!important;max-width:1120px!important;margin:0 auto!important;padding:30px 32px 44px!important}
.panel{border:2px solid var(--lp-line)!important;border-radius:24px!important;background:#fff!important;box-shadow:0 3px 0 rgba(32,33,36,.035)!important;padding:24px!important;min-width:0!important}
.pagehead{display:flex!important;align-items:center!important;gap:14px!important;min-width:0}
.pagehead>div{min-width:0}
.pagehead h1{font-weight:900!important;letter-spacing:-.035em!important;overflow-wrap:anywhere}
.pageicon,.staticon{width:44px!important;height:44px!important;border-radius:14px!important;background:var(--lp-soft)!important;color:var(--lp-purple)!important;display:grid!important;place-items:center!important;flex:0 0 44px!important;box-shadow:none!important}
.pageicon .icon,.staticon .icon{width:21px!important;height:21px!important;stroke-width:2!important}
.eyebrow{font-size:11px!important;letter-spacing:.11em!important;font-weight:900!important;color:var(--lp-purple)!important}
.muted{color:var(--lp-muted)!important;line-height:1.5}
.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important}
.stat{font-size:32px!important;font-weight:950!important;letter-spacing:-.03em}
.stathead{gap:11px!important}
.primary{background:var(--lp-green)!important;color:#fff!important;border:0!important;box-shadow:0 4px 0 var(--lp-green-dark)!important}
.primary:hover{background:#61d309!important}
.secondary{box-shadow:0 2px 0 rgba(32,33,36,.05)!important}
.form input,.lp-setting-input{border:2px solid var(--lp-line)!important;border-radius:14px!important;background:#fafaff!important;min-height:50px!important}
.form input:focus,.lp-setting-input:focus{border-color:var(--lp-blue)!important;box-shadow:0 0 0 4px rgba(28,176,246,.12)!important}
.progress{height:12px!important;background:#ececf2!important;border-radius:999px!important}
.progress i{background:var(--lp-green)!important;border-radius:999px!important}
.goal{border-radius:20px!important}
.themegrid{gap:10px!important}
.theme{min-height:54px!important;border:2px solid var(--lp-line)!important;border-radius:14px!important;background:#fff!important}
.theme.selected{border-color:var(--lp-purple)!important;background:var(--lp-soft)!important}
.theme .staticon{width:34px!important;height:34px!important;flex-basis:34px!important;border-radius:10px!important}
.table td,.table th{border-bottom:2px solid #f0f0f4!important}
.lp-settings-card{margin-top:18px!important}
.lp-setting-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;border-bottom:1px solid var(--lp-line)}
.lp-setting-row:last-of-type{border-bottom:0}
.lp-setting-copy{min-width:0;flex:1}.lp-setting-title{font-weight:900;font-size:16px}.lp-setting-desc{font-size:13px;color:var(--lp-muted);margin-top:4px;line-height:1.4}
.lp-setting-input{width:min(300px,55vw);padding:10px 13px;color:var(--lp-ink);font-weight:700;outline:none}
.lp-toggle{position:relative;width:54px;height:32px;border:0!important;border-radius:999px!important;background:#d8dbe2!important;padding:0!important;flex:0 0 54px;box-shadow:inset 0 1px 2px rgba(0,0,0,.08)!important}
.lp-toggle::after{content:"";position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.18);transition:left .18s ease}
.lp-toggle.on{background:var(--lp-green)!important}.lp-toggle.on::after{left:26px}
.lp-save{min-height:46px!important;padding:10px 17px!important}
.lp-settings-note{margin-top:14px;font-size:13px;color:var(--lp-muted);line-height:1.45}
.lp-reduced-motion *{transition:none!important;animation:none!important}
@media(max-width:900px){
 .appbar{height:68px!important;padding:0 14px!important}
 .appbar .brand{font-size:19px!important}
 .appbar .brand .mark{width:38px!important;height:38px!important}
 .appbar .actions b{display:none!important}
 .appbar .actions .secondary{width:46px!important;min-width:46px!important;padding:10px!important}
 .appbar .actions .secondary .icon{margin:auto!important}
 .appbody{display:block!important;min-height:calc(100dvh - 68px)!important}
 .side{position:fixed!important;display:none;left:0;top:68px;bottom:0;width:min(292px,84vw)!important;z-index:50;border-right:2px solid var(--lp-line)!important;box-shadow:18px 0 45px rgba(25,30,45,.18)!important;padding:18px 14px!important;overflow-y:auto}
 .main{max-width:none!important;padding:18px 14px 34px!important}
 .grid{grid-template-columns:1fr!important;gap:12px!important}
 .panel{padding:18px!important;border-radius:20px!important}
 .pageicon,.staticon{width:42px!important;height:42px!important;flex-basis:42px!important}
 .pagehead h1{font-size:28px!important}
 .stat{font-size:30px!important}
 .lp-setting-row{align-items:flex-start;flex-direction:column;gap:12px}
 .lp-setting-input{width:100%;max-width:none}
 .lp-setting-row .lp-save,.lp-setting-row .lp-toggle{align-self:flex-start}
 .themegrid{grid-template-columns:1fr 1fr!important}
}
@media(max-width:520px){
 .appbar{height:64px!important;padding:0 10px!important}
 .appbar .brand{font-size:18px!important;gap:7px!important}
 .appbar .brand .mark{width:36px!important;height:36px!important;border-radius:12px!important}
 .appbar .actions .secondary{width:44px!important;min-width:44px!important;height:44px!important}
 .side{top:64px!important}
 .main{padding:12px 10px 28px!important}
 .panel{padding:16px!important;border-radius:18px!important}
 .pagehead{gap:10px!important}
 .pageicon,.staticon{width:40px!important;height:40px!important;flex-basis:40px!important;border-radius:12px!important}
 .pagehead h1{font-size:25px!important}
 .stat{font-size:27px!important}
 .themegrid{grid-template-columns:1fr!important}
 .goal{gap:12px!important}
 .lp-setting-row{padding:16px 0}
}
@media(max-width:360px){
 .appbar .brand{font-size:17px!important}
 .appbar .brand .mark{width:34px!important;height:34px!important}
 .main{padding-left:8px!important;padding-right:8px!important}
 .panel{padding:14px!important}
 .pagehead h1{font-size:23px!important}
}
`;

function injectStyle(){
  if(document.getElementById('lifepilot-ui-enhancements'))return;
  const style=document.createElement('style');
  style.id='lifepilot-ui-enhancements';
  style.textContent=STYLE;
  document.head.appendChild(style);
}

function makeRow(title,desc,control){
  const row=document.createElement('div'); row.className='lp-setting-row';
  const copy=document.createElement('div'); copy.className='lp-setting-copy';
  copy.innerHTML=`<div class="lp-setting-title">${title}</div><div class="lp-setting-desc">${desc}</div>`;
  row.append(copy,control); return row;
}

async function mountSettingsEnhancements(){
  const h1=[...document.querySelectorAll('h1')].find(x=>x.textContent.trim()==='Impostazioni');
  if(!h1 || document.getElementById('lp-settings-enhancements'))return;
  const host=h1.closest('.panel'); if(!host)return;
  const wrap=document.createElement('section');
  wrap.id='lp-settings-enhancements'; wrap.className='panel lp-settings-card';
  const title=document.createElement('div');
  title.className='pagehead';
  title.innerHTML='<span class="pageicon"><svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0 1.6 1h.1V14h-.1a1.7 1.7 0 0 0-1.6 1Z"/></svg></span><div><div class="eyebrow">PERSONALIZZAZIONE</div><h2 style="margin:6px 0">Il tuo LifePilot</h2></div>';
  wrap.appendChild(title);

  let nickname=localStorage.getItem('lifepilot-nickname')||'';
  try{const{data:{user}}=await supabase.auth.getUser(); if(user){const{data}=await supabase.from('profiles').select('nickname').eq('id',user.id).maybeSingle(); if(data?.nickname)nickname=data.nickname;}}catch{}
  const nick=document.createElement('input'); nick.className='lp-setting-input'; nick.value=nickname; nick.maxLength=30; nick.placeholder='Il tuo nickname';
  const save=document.createElement('button'); save.className='primary lp-save'; save.textContent='Salva';
  const nickControl=document.createElement('div'); nickControl.className='actions'; nickControl.append(nick,save);
  const nickRow=makeRow('Nickname','Cambia il nome che compare nella tua dashboard.',nickControl);
  save.onclick=async()=>{const value=nick.value.trim(); if(value.length<2){alert('Il nickname deve avere almeno 2 caratteri.');return} save.disabled=true;try{const{data:{user}}=await supabase.auth.getUser();if(user){const{error}=await supabase.from('profiles').update({nickname:value}).eq('id',user.id);if(error)throw error}localStorage.setItem('lifepilot-nickname',value);document.querySelectorAll('h1').forEach(el=>{if(el.textContent.includes('Buongiorno,'))el.textContent=`Buongiorno, ${value}`});document.querySelectorAll('.appbar .actions b').forEach(el=>el.textContent=value);save.textContent='Salvato ✓';setTimeout(()=>save.textContent='Salva',1400)}catch(e){alert(e.message||'Impossibile salvare il nickname')}finally{save.disabled=false}};
  wrap.appendChild(nickRow);

  const notifications=localStorage.getItem('lifepilot-notifications')!=='off';
  const toggle=document.createElement('button'); toggle.className=`lp-toggle ${notifications?'on':''}`; toggle.setAttribute('aria-label','Notifiche');
  toggle.onclick=async()=>{const next=!toggle.classList.contains('on');toggle.classList.toggle('on',next);localStorage.setItem('lifepilot-notifications',next?'on':'off');if(next&&'Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch{}}};
  wrap.appendChild(makeRow('Notifiche','Attiva o disattiva i promemoria e le notifiche di LifePilot.',toggle));

  const sound=localStorage.getItem('lifepilot-sounds')!=='off';
  const soundToggle=document.createElement('button'); soundToggle.className=`lp-toggle ${sound?'on':''}`;
  soundToggle.onclick=()=>{const next=!soundToggle.classList.contains('on');soundToggle.classList.toggle('on',next);localStorage.setItem('lifepilot-sounds',next?'on':'off')};
  wrap.appendChild(makeRow('Suoni','Controlla i suoni e i feedback dell’interfaccia.',soundToggle));

  const reduced=localStorage.getItem('lifepilot-reduced-motion')==='on';
  const motionToggle=document.createElement('button'); motionToggle.className=`lp-toggle ${reduced?'on':''}`;
  motionToggle.onclick=()=>{const next=!motionToggle.classList.contains('on');motionToggle.classList.toggle('on',next);localStorage.setItem('lifepilot-reduced-motion',next?'on':'off');document.documentElement.classList.toggle('lp-reduced-motion',next)};
  wrap.appendChild(makeRow('Riduci animazioni','Riduce le animazioni per un’esperienza più semplice e accessibile.',motionToggle));

  const note=document.createElement('div'); note.className='lp-settings-note'; note.textContent='Le preferenze vengono salvate su questo dispositivo. Il nickname viene salvato anche nel tuo profilo LifePilot.'; wrap.appendChild(note);
  host.parentElement.insertBefore(wrap,host.nextSibling);
}

injectStyle();
const observer=new MutationObserver(()=>mountSettingsEnhancements());
observer.observe(document.body,{childList:true,subtree:true});
mountSettingsEnhancements();
