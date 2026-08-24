import React,{useEffect,useState} from 'react';
import {BarChart3,Home,Target,Zap,Trophy,Brain,MoreHorizontal} from 'lucide-react';
import './gameplay.css';

const primary=[['home','Home',Home],['plan','Piano',BarChart3],['goals','Obiettivi',Target],['focus','Focus',Zap],['gameplay','Gameplay',Trophy]];

export default function MobileBottomNav(){
 const [visible,setVisible]=useState(false),[active,setActive]=useState('home');
 useEffect(()=>{const style=document.createElement('style');style.textContent=`
 .lp-mobile-bottom-nav{display:none}@media(max-width:900px){.lp-mobile-bottom-nav{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));height:66px;display:grid;grid-template-columns:repeat(5,1fr);align-items:center;padding:5px;background:rgba(10,14,20,.96);border:1px solid #202a36;border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.35);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:50}.lp-mobile-bottom-nav button{min-width:0;height:54px;border:0;background:transparent;color:#7f8b99;border-radius:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:9px;font-weight:700;transition:.16s ease;white-space:nowrap}.lp-mobile-bottom-nav button.active{background:#5eead414;color:#5eead4}.lp-mobile-bottom-nav button.gameplay{color:#f5c76b}.lp-mobile-bottom-nav button.gameplay.active{background:#f5c76b18;color:#ffd98a}.lp-mobile-bottom-nav button:active{transform:scale(.96)}.lp-mobile-bottom-nav svg{width:18px;height:18px}.lp-main{padding-bottom:102px!important}}
 `;document.head.appendChild(style);const sync=()=>{const app=document.querySelector('.lp-app'),nav=document.querySelector('.lp-side .nav');const show=!!app&&!!nav;setVisible(show);if(!show)return;const current=nav.querySelector('button.active');if(current){const t=current.textContent.trim();const found=primary.find(x=>t===x[1]||(x[0]==='plan'&&t==='Il mio piano')||(x[0]==='gameplay'&&t.startsWith('Gameplay')));if(found)setActive(found[0]);}};const o=new MutationObserver(sync);o.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});sync();return()=>{o.disconnect();style.remove()};},[]);
 const go=key=>{setActive(key);window.dispatchEvent(new CustomEvent('lifepilot:navigate',{detail:key}));};
 const openMore=()=>window.dispatchEvent(new CustomEvent('lifepilot:quiz-open',{detail:{source:'mobile-more',fromPlan:false}}));
 if(!visible)return null;return <nav className="lp-mobile-bottom-nav" aria-label="Navigazione rapida mobile">{primary.map(([key,label,Icon])=><button key={key} className={(active===key?'active ':'')+(key==='gameplay'?'gameplay':'')} onClick={()=>go(key)} aria-label={label}><Icon/>{label}</button>)}<button onClick={openMore} aria-label="Quiz e altre sezioni"><MoreHorizontal/>Quiz</button></nav>;
}
