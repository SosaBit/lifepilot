import { supabase } from './lib/supabase'

const ID = 'lifepilot-admin-console'
const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))

function styles(){
  if(document.getElementById(`${ID}-style`)) return
  const s=document.createElement('style');s.id=`${ID}-style`;s.textContent=`#${ID}{position:fixed;right:16px;top:88px;z-index:1100;font-family:Inter,system-ui,sans-serif}#${ID}>button{border:0;border-radius:14px;padding:10px 13px;background:#111827;color:#fff;font-weight:800;box-shadow:0 10px 30px #0003}#${ID} .ac-panel{position:absolute;right:0;top:48px;width:min(520px,calc(100vw - 24px));max-height:80vh;overflow:auto;background:#fff;color:#171717;border:1px solid #e5e7eb;border-radius:20px;padding:16px;box-shadow:0 24px 70px #0004}#${ID} h3{margin:0 0 4px}#${ID} .ac-muted{color:#6b7280;font-size:13px}#${ID} .ac-section{border-top:1px solid #eee;margin-top:14px;padding-top:14px}#${ID} input,#${ID} textarea,#${ID} select{width:100%;box-sizing:border-box;margin-top:7px;padding:10px;border:1px solid #ddd6fe;border-radius:10px;font:inherit}#${ID} textarea{min-height:80px;resize:vertical}#${ID} .ac-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}#${ID} .ac-actions button{border:0;border-radius:10px;padding:9px 11px;background:#6c5ce7;color:#fff;font-weight:800}#${ID} .ac-actions .danger{background:#fee2e2;color:#991b1b}#${ID} .ac-item{border:1px solid #eee;border-radius:14px;padding:11px;margin-top:9px}#${ID} .ac-pill{display:inline-flex;border-radius:999px;padding:4px 7px;background:#f1edff;color:#6c5ce7;font-size:10px;font-weight:800}`;document.head.appendChild(s)
}

async function admin(){
  if(!supabase) return false
  const {data:{session}}=await supabase.auth.getSession(); if(!session?.user) return false
  const {data:p}=await supabase.from('profiles').select('role').eq('id',session.user.id).maybeSingle(); return p?.role==='admin'
}

async function load(){
  const [{data:events},{data:announcements}]=await Promise.all([
    supabase.from('events').select('*').order('starts_at',{ascending:false}),
    supabase.from('announcements').select('*').order('created_at',{ascending:false}),
  ])
  return {events:events||[],announcements:announcements||[]}
}

async function editAnnouncement(id,item){
  const title=prompt('Titolo annuncio',item.title);if(title===null)return
  const body=prompt('Testo annuncio',item.body);if(body===null)return
  const level=prompt('Livello: info / success / warning / urgent',item.level||'info')||'info'
  await supabase.from('announcements').update({title,body,level}).eq('id',id)
  render()
}
async function editEvent(id,item){
  const title=prompt('Titolo evento',item.title);if(title===null)return
  const description=prompt('Descrizione',item.description||'');if(description===null)return
  const location=prompt('Luogo',item.location||'')
  await supabase.from('events').update({title,description,location}).eq('id',id)
  render()
}
async function remove(table,id){if(!confirm('Eliminare definitivamente questo contenuto?'))return;await supabase.from(table).delete().eq('id',id);render()}
async function toggle(table,id,published){await supabase.from(table).update({published:!published}).eq('id',id);render()}

async function render(){
  const root=document.getElementById(ID);if(!root)return
  const {events,announcements}=await load()
  const eventHtml=events.map(e=>`<div class="ac-item"><span class="ac-pill">Evento · ${e.published?'pubblicato':'bozza'}</span><strong>${esc(e.title)}</strong><div class="ac-muted">${esc(e.location||'')} · ${new Date(e.starts_at).toLocaleString('it-IT')}</div><div class="ac-actions"><button data-edit-event="${e.id}">Modifica</button><button data-toggle-event="${e.id}" data-published="${e.published}">${e.published?'Nascondi':'Pubblica'}</button><button class="danger" data-del-event="${e.id}">Elimina</button></div></div>`).join('')||'<div class="ac-muted">Nessun evento.</div>'
  const annHtml=announcements.map(a=>`<div class="ac-item"><span class="ac-pill">Annuncio · ${a.published?'pubblicato':'bozza'}</span><strong>${esc(a.title)}</strong><div>${esc(a.body)}</div><div class="ac-actions"><button data-edit-ann="${a.id}">Modifica</button><button data-toggle-ann="${a.id}" data-published="${a.published}">${a.published?'Nascondi':'Pubblica'}</button><button class="danger" data-del-ann="${a.id}">Elimina</button></div></div>`).join('')||'<div class="ac-muted">Nessun annuncio.</div>'
  root.querySelector('.ac-panel').innerHTML=`<h3>Amministrazione LifePilot</h3><div class="ac-muted">CRUD completo in tempo reale. Le modifiche sono protette da RLS.</div><div class="ac-section"><strong>Eventi</strong>${eventHtml}</div><div class="ac-section"><strong>Annunci</strong>${annHtml}</div><div class="ac-section"><button id="ac-close" style="border:0;border-radius:10px;padding:9px 11px;background:#111827;color:#fff;font-weight:800">Chiudi</button></div>`
  root.querySelectorAll('[data-edit-event]').forEach(b=>b.onclick=()=>editEvent(b.dataset.editEvent,events.find(x=>x.id===b.dataset.editEvent)))
  root.querySelectorAll('[data-del-event]').forEach(b=>b.onclick=()=>remove('events',b.dataset.delEvent))
  root.querySelectorAll('[data-toggle-event]').forEach(b=>b.onclick=()=>toggle('events',b.dataset.toggleEvent,b.dataset.published==='true'))
  root.querySelectorAll('[data-edit-ann]').forEach(b=>b.onclick=()=>editAnnouncement(b.dataset.editAnn,announcements.find(x=>x.id===b.dataset.editAnn)))
  root.querySelectorAll('[data-del-ann]').forEach(b=>b.onclick=()=>remove('announcements',b.dataset.delAnn))
  root.querySelectorAll('[data-toggle-ann]').forEach(b=>b.onclick=()=>toggle('announcements',b.dataset.toggleAnn,b.dataset.published==='true'))
  root.querySelector('#ac-close').onclick=()=>{root.querySelector('.ac-panel').hidden=true}
}

async function boot(){
  if(!await admin() || document.getElementById(ID))return
  styles();const root=document.createElement('div');root.id=ID;root.innerHTML='<button aria-label="Amministrazione">Admin</button><div class="ac-panel" hidden></div>';document.body.appendChild(root)
  root.querySelector('button').onclick=async()=>{const p=root.querySelector('.ac-panel');p.hidden=!p.hidden;if(!p.hidden)await render()}
  supabase.channel('lifepilot-admin-refresh').on('postgres_changes',{event:'*',schema:'public',table:'events'},render).on('postgres_changes',{event:'*',schema:'public',table:'announcements'},render).subscribe()
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
