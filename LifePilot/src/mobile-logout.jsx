import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {LogOut} from 'lucide-react';
import {supabase} from './lib/supabase';

export default function MobileLogout(){
  const [drawer,setDrawer]=useState(null);
  useEffect(()=>{
    const sync=()=>setDrawer(document.querySelector('.lp-drawer'));
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    sync();
    return()=>observer.disconnect();
  },[]);
  if(!drawer)return null;
  return createPortal(<>
    <style>{`
      @media(max-width:900px){
        .lp-drawer{display:flex !important;flex-direction:column !important;overflow:hidden !important}
        .lp-drawer .nav{flex:1 1 auto !important;min-height:0 !important;overflow-y:auto !important;overflow-x:hidden !important;padding-bottom:8px !important}
        .lp-drawer .lp-mobile-logout{position:relative;left:auto;bottom:auto;width:calc(100% - 36px);height:48px;min-height:48px;flex:0 0 48px;margin:10px 18px max(14px,env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:flex-start;gap:10px;padding:0 14px;border:1px solid var(--border,#202a36);border-radius:12px;background:var(--surface,#10161f);color:var(--text,#f4f7fa);font:inherit;font-weight:700;z-index:2001;box-shadow:0 8px 24px #00000055;cursor:pointer}
        .lp-drawer .lp-mobile-logout svg{width:18px;height:18px;flex:0 0 auto}
      }
    `}</style>
    <button className="lp-mobile-logout" type="button" onClick={()=>supabase.auth.signOut()} aria-label="Esci">
      <LogOut size={18}/>Esci
    </button>
  </>,drawer);
}
