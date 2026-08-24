import React,{useEffect,useState} from 'react';
import {BarChart3,CalendarDays,Home,Target,Zap,Trophy} from 'lucide-react';

const items=[['home','Home',Home],['plan','Piano',BarChart3],['goals','Obiettivi',Target],['calendar','Calendario',CalendarDays],['focus','Focus',Zap],['gameplay','Gameplay',Trophy]];

export default function MobileBottomNav(){
  const [visible,setVisible]=useState(false),[active,setActive]=useState('home');
  useEffect(()=>{
    const style=document.createElement('style');style.textContent=`
      .lp-mobile-bottom-nav{display:none}
      @media(max-width:900px){.lp-mobile-bottom-nav{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));height:66px;display:grid;grid-template-columns:repeat(6,1fr);align-items:center;padding:5px;background:rgba(10,14,20,.96);border:1px solid #202a36;border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.35);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:50}.lp-mobile-bottom-nav button{min-width:0;height:54px;border:0;background:transparent;color:#7f8b99;border-radius:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:9px;font-weight:700;transition:.16s ease;white-space:nowrap}.lp-mobile-bottom-nav button.active{background:#5eead414;color:#5eead4}.lp-mobile-bottom-nav button.gameplay{color:#f5c76b}.lp-mobile-bottom-nav button.gameplay.active{background:#f5c76b18;color:#ffd98a}.lp-mobile-bottom-nav button:active{transform:scale(.96)}.lp-mobile-bottom-nav svg{width:18px;height:18px}.lp-main{padding-bottom:102px!important}}
    `;document.head.appendChild(style);
    const sync=()=>{const app=document.querySelector('.lp-app'),nav=document.querySelector('.lp-side .nav');const shouldShow=!!app&&!!nav;setVisible(shouldShow);if(!shouldShow)return;const current=nav.querySelector('button.active');if(current){const text=current.textContent.trim();const found=items.find(x=>text===x[1]||(x[0]==='plan'&&text==='Il mio piano'));if(found)setActive(found[0])}};
    const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});sync();return()=>{observer.disconnect();style.remove()};
  },[]);
  const go=key=>{setActive(key);window.dispatchEvent(new CustomEvent('lifepilot:navigate',{detail:key}))};
  if(!visible)return null;
  return <nav className="lp-mobile-bottom-nav" aria-label="Navigazione rapida mobile">{items.map(([key,label,Icon])=><button key={key} className={(active===key?'active ':'')+(key==='gameplay'?'gameplay':'')} onClick={()=>go(key)} aria-label={label} aria-current={active===key?'page':undefined}><Icon/>{label}</button>)}</nav>;
}
