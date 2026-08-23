import React,{useEffect,useState} from 'react';
import {BarChart3,CalendarDays,Home,Target,Zap} from 'lucide-react';

const items=[
  ['home','Home',Home],
  ['plan','Piano',BarChart3],
  ['goals','Obiettivi',Target],
  ['calendar','Calendario',CalendarDays],
  ['focus','Focus',Zap]
];

export default function MobileBottomNav(){
  const [visible,setVisible]=useState(false);
  const [active,setActive]=useState('home');

  useEffect(()=>{
    const style=document.createElement('style');
    style.textContent=`
      .lp-mobile-bottom-nav{display:none}
      @media(max-width:900px){
        .lp-mobile-bottom-nav{position:fixed;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));height:64px;display:grid;grid-template-columns:repeat(5,1fr);align-items:center;padding:6px;background:rgba(10,14,20,.94);border:1px solid #202a36;border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.35);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:90}
        .lp-mobile-bottom-nav button{min-width:0;height:52px;border:0;background:transparent;color:#7f8b99;border-radius:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:10px;font-weight:700;transition:.16s ease}
        .lp-mobile-bottom-nav button.active{background:#5eead414;color:#5eead4}
        .lp-mobile-bottom-nav button:active{transform:scale(.96)}
        .lp-mobile-bottom-nav svg{width:19px;height:19px}
        .lp-main{padding-bottom:98px!important}
      }
    `;
    document.head.appendChild(style);

    const sync=()=>{
      const app=document.querySelector('.lp-app');
      const nav=document.querySelector('.lp-side .nav');
      const shouldShow=!!app && !!nav;
      setVisible(shouldShow);
      if(!shouldShow)return;
      const current=nav.querySelector('button.active');
      if(current){
        const text=current.textContent.trim();
        const found=items.find(x=>text.startsWith(x[1]) || (x[0]==='plan'&&text.startsWith('Il mio piano')));
        if(found)setActive(found[0]);
      }
    };

    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    sync();
    const timer=setInterval(sync,500);
    return()=>{observer.disconnect();clearInterval(timer);style.remove()};
  },[]);

  const go=(key)=>{
    const nav=document.querySelector('.lp-side .nav');
    if(!nav)return;
    const buttons=[...nav.querySelectorAll('button')];
    const target=items.find(x=>x[0]===key);
    const button=buttons.find(b=>{
      const text=b.textContent.trim();
      return text===target[1] || (key==='plan'&&text==='Il mio piano');
    });
    if(button){setActive(key);button.click();}
  };

  if(!visible)return null;
  return <nav className="lp-mobile-bottom-nav" aria-label="Navigazione rapida mobile">
    {items.map(([key,label,Icon])=><button key={key} className={active===key?'active':''} onClick={()=>go(key)} aria-label={label}><Icon/>{label}</button>)}
  </nav>;
}
