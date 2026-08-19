import { supabase } from './lib/supabase';

const STYLE = `
:root{--lp-green:#58cc02;--lp-green-dark:#46a302;--lp-blue:#1cb0f6;--lp-purple:#7c5cff;--lp-yellow:#ffc800;--lp-red:#ff4b4b;--lp-bg:#f6f7fb;--lp-card:#fff;--lp-ink:#202124;--lp-muted:#777b86;--lp-line:#e4e7ee}
body{background:var(--lp-bg)!important;color:var(--lp-ink)!important}
button{border-radius:16px!important;transition:transform .12s ease,box-shadow .12s ease,background .12s ease!important}
button:active{transform:translateY(1px)}
.appbar{height:76px!important;padding:0 28px!important;border-bottom:2px solid var(--lp-line)!important;box-shadow:0 2px 0 rgba(0,0,0,.02)!important}
.appbar .brand{font-size:22px!important;font-weight:900!important}
.mark{width:42px!important;height:42px!important;border-radius:14px!important;background:var(--lp-purple)!important;box-shadow:0 4px 0 rgba(124,92,255,.22)!important}
.appbar .secondary{background:#fff!important;border:2px solid var(--lp-line)!important;box-shadow:0 3px 0 rgba(0,0,0,.05)!important}
.appbody{grid-template-columns:250px minmax(0,1fr)!important}
.side{padding:24px 16px!important;background:#fff!important;border-right:2px solid var(--lp-line)!important}
.nav{min-height:52px!important;border-radius:16px!important;font-size:15px!important;font-weight:850!important;padding:13px 16px!important}
.nav.active{background:#eaf8df!important;color:var(--lp-green-dark)!important;box-shadow:inset 4px 0 0 var(--lp-green)!important}
.nav:hover{background:#f3f4f8!important;color:var(--lp-ink)!important}
.logout{border:2px solid #ffd6d6!important;background:#fff5f5!important;color:#d83b3b!important}
.main{max-width:1080px!important;padding:34px!important}
.panel{border:2px solid var(--lp-line)!important;border-radius:24px!important;background:#fff!important;box-shadow:0 4px 0 rgba(32,33,36,.04)!important;padding:24px!important}
.pagehead{gap:15px!important}
.pageicon,.staticon{border-radius:16px!important;background:#eeeafe!important;color:var(--lp-purple)!important;box-shadow:inset 0 -2px 0 rgba(124,92,255,.08)!important}
.eyebrow{font-size:12px!important;letter-spacing:.11em!important;font-weight:900!important}
h1{font-weight:900!important;letter-spacing:-.035em!important}
.muted{color:var(--lp-muted)!important}
.stat{font-size:34px!important;font-weight:950!important}
.primary{background:var(--lp-green)!important;color:#fff!important;box-shadow:0 4px 0 var(--lp-green-dark)!important;border:0!important}
.primary:hover{background:#61d309!important}
.secondary{box-shadow:0 3px 0 rgba(0,0,0,.06)!important}
.form input{border:2px solid var(--lp-line)!important;border-radius:16px!important;background:#fafbfe!important;min-height:50px!important}
.form input:focus{border-color:var(--lp-blue)!important;box-shadow:0 0 0 4px rgba(28,176,246,.12)!important}
.progress{height:12px!important;background:#e8ebf1!important;border-radius:999px!important}
.progress i{background:var(--lp-green)!important;border-radius:999px!important}
.theme{border:2px solid var(--lp-line)!important;border-radius:16px!important}
.theme.selected{border-color:var(--lp-purple)!important;background:#f3f0ff!important}
.table td,.table th{border-bottom:2px solid #f0f1f4!important}
.lp-settings-card{margin-top:18px!important}
.lp-setting-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:17px 0;border-bottom:1px solid var(--lp-line)}
.lp-setting-row:last-child{border-bottom:0}
.lp-setting-copy{min-width:0}.lp-setting-title{font-weight:900;font-size:16px}.lp-setting-desc{font-size:13px;color:var(--lp-muted);margin-top:3px;line-height:1.35}
.lp-setting-input{width:min(280px,55vw);min-height:46px;border:2px solid var(--lp-line);border-radius:14px;padding:10px 13px;background:#fafbfe;color:var(--lp-ink);font-weight:700;outline:none}
.lp-setting-input:focus{border-color:var(--lp-blue);box-shadow:0 0 0 4px rgba(28,176,246,.1)}
.lp-toggle{position:relative;width:54px;height:32px;border:0!important;border-radius:999px!important;background:#d8dbe2!important;padding:0!important;flex:0 0 auto;box-shadow:inset 0 1px 2px rgba(0,0,0,.08)!important}
.lp-toggle::after{content:"";position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.18);transition:left .18s ease}
.lp-toggle.on{background:var(--lp-green)!important}.lp-toggle.on::after{left:26px}
.lp-save{min-height:46px!important;padding:11px 17px!important}
.lp-settings-note{margin-top:12px;font-size:13px;color:var(--lp-muted)}
@media(max-width:800px){
 .appbar{height:68px!important;padding:0 12px!important}
 .appbar .brand{font-size:19px!important}
 .appbar .mark{width:38px!important;height:38px!important}
 .appbar .actions b{display:none!important}
 .appbar .actions .secondary{min-width:46px!important;width:46px!important;padding:10px!important}
 .appbody{min-height:calc(100dvh - 68px)!important}
 .side{top:68px!important;width:min(300px,86vw)!important;border-right:2px solid var(--lp-line)!important;box-shadow:20px 0 45px rgba(25,30,45,.18)!important}
 .main{padding:16px 12px 28px!important}
 .grid{gap:12px!important}
 .panel{border-radius:22px!important;padding:18px!important}
 .pagehead h1{font-size:28px!important}
 .stat{font-size:30px!important}
 .themegrid{gap:8px!important}
 .lp-setting-row{align-items:flex-start;flex-direction:column;gap:12px}
 .lp-setting-input{width:100%;max-width:none}
 .lp-setting-row .lp-save,.lp-setting-row .lp-toggle{align-self:flex-start}
}
@media(max-width:420px){
 .appbar{height:64px!important}.side{top:64px!important}
 .main{padding:12px 9px 24px!important}
 .panel{padding:16px!important;border-radius:20px!important}
 .pageicon,.staticon{width:40px!important;height:40px!important}
 .pagehead h1{font-size:25px!important}
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
  title.innerHTML='<span class="pageicon"><svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14h-.1a1.7 1.7 0 0 0-1.6 1Z"/></svg></span><div><div class="eyebrow">PERSONALIZZAZIONE</div><h2 style="margin:6px 0">Il tuo LifePilot</h2></div>';
  wrap.appendChild(title);

  let nickname=localStorage.getItem('lifepilot-nickname')||'';
  try{const{data:{user}}=await supabase.auth.getUser(); if(user){const{data}=await supabase.from('profiles').select('nickname').eq('id',user.id).maybeSingle(); if(data?.nickname)nickname=data.nickname;}}catch{}
  const nick=document.createElement('input'); nick.className='lp-setting-input'; nick.value=nickname; nick.maxLength=30; nick.placeholder='Il tuo nickname';
  const save=document.createElement('button'); save.className='primary lp-save'; save.textContent='Salva';
  const nickControl=document.createElement('div'); nickControl.className='actions'; nickControl.append(nick,save);
  const nickRow=makeRow('Nickname','Cambia il nome che compare nella tua dashboard.',nickControl);
  save.onclick=async()=>{const value=nick.value.trim(); if(value.length<2){alert('Il nickname deve avere almeno 2 caratteri.');return} save.disabled=true;try{const{data:{user}}=await supabase.auth.getUser();if(user){const{error}=await supabase.from('profiles').update({nickname:value}).eq('id',user.id);if(error)throw error}localStorage.setItem('lifepilot-nickname',value);document.querySelectorAll('h1').forEach(el=>{if(el.textContent.includes('Buongiorno,')){el.textContent=`Buongiorno, ${value}`}});document.querySelectorAll('.appbar .actions b').forEach(el=>el.textContent=value);save.textContent='Salvato ✓';setTimeout(()=>save.textContent='Salva',1400)}catch(e){alert(e.message||'Impossibile salvare il nickname')}finally{save.disabled=false}};
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
