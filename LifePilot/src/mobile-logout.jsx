import React,{useEffect,useState} from 'react';
import {LogOut} from 'lucide-react';
import {supabase} from './lib/supabase';

export default function MobileLogout(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const sync=()=>setOpen(!!document.querySelector('.lp-drawer'));
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    sync();
    return()=>observer.disconnect();
  },[]);
  if(!open)return null;
  return <>
    <style>{`
      .lp-mobile-logout{display:none}
      @media(max-width:900px){
        .lp-mobile-logout{position:fixed;left:18px;bottom:max(18px,env(safe-area-inset-bottom));width:254px;height:48px;display:flex;align-items:center;gap:10px;padding:0 14px;border:1px solid var(--border,#202a36);border-radius:12px;background:var(--surface,#10161f);color:var(--text,#f4f7fa);font:inherit;font-weight:700;z-index:2000;box-shadow:0 8px 24px #00000055;cursor:pointer}
        .lp-mobile-logout svg{width:18px;height:18px;flex:0 0 auto}
      }
    `}</style>
    <button className="lp-mobile-logout" type="button" onClick={()=>supabase.auth.signOut()} aria-label="Esci">
      <LogOut size={18}/>Esci
    </button>
  </>;
}
