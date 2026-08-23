import React,{useEffect,useState} from 'react';
import {ArrowRight,Check,Target,Sparkles,Zap} from 'lucide-react';
import {supabase} from './lib/supabase';

const steps=[
  {eyebrow:'BENVENUTO',title:'Benvenuto in LifePilot.',text:'Un piccolo sistema per trasformare quello che vuoi ottenere in azioni concrete.',icon:Sparkles},
  {eyebrow:'IL TUO PRIMO PASSO',title:'Partiamo da un obiettivo.',text:'Scegli una cosa importante su cui vuoi concentrarti. Potrai aggiungerne altre in seguito.',icon:Target},
  {eyebrow:'COME FUNZIONA',title:'Obiettivo → Piano → Focus.',text:'LifePilot ti porta dal risultato che vuoi raggiungere alle azioni quotidiane, poi ti aiuta a concentrarti.',icon:Zap},
];

export default function OnboardingGate({children}){
  const [ready,setReady]=useState(false),[session,setSession]=useState(null),[profile,setProfile]=useState(null),[goals,setGoals]=useState([]),[step,setStep]=useState(0),[title,setTitle]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const load=async()=>{
    const {data:{session:s}}=await supabase.auth.getSession();
    setSession(s);
    if(!s){setReady(true);return;}
    const [{data:p},{data:g}]=await Promise.all([
      supabase.from('profiles').select('id,nickname,onboarding_completed').eq('id',s.user.id).maybeSingle(),
      supabase.from('goals').select('id,title').eq('user_id',s.user.id).order('created_at',{ascending:false}).limit(20)
    ]);
    setProfile(p);setGoals(g||[]);setReady(true);
  };
  useEffect(()=>{load();const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>load());return()=>subscription.unsubscribe()},[]);
  if(!ready||!session||!profile||profile.onboarding_completed===true)return children;
  const finish=async()=>{
    setBusy(true);setError('');
    const {error:e}=await supabase.from('profiles').update({onboarding_completed:true}).eq('id',session.user.id);
    if(e){setError(e.message||'Non riesco a salvare il completamento.');setBusy(false);return;}
    setProfile({...profile,onboarding_completed:true});setBusy(false);
  };
  const next=async()=>{
    if(step===1&&!goals.length&&!title.trim()){setError('Inserisci almeno un obiettivo per continuare.');return;}
    if(step===1&&title.trim()){
      setBusy(true);setError('');
      const {data,error:e}=await supabase.from('goals').insert({user_id:session.user.id,title:title.trim(),category:'personale',days:30,daily_minutes:20,priority:2,progress:0,streak:0}).select('id,title').single();
      if(e){setError(e.message||'Non riesco a creare l’obiettivo.');setBusy(false);return;}
      setGoals([data,...goals]);setTitle('');setBusy(false);
    }
    if(step<steps.length-1){setStep(step+1);return;}
    await finish();
  };
  const StepIcon=steps[step].icon;
  return <div className="lp-onboarding" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:'24px',background:'var(--lp-bg,#f7f8fa)'}}>
    <div style={{width:'100%',maxWidth:560,background:'var(--lp-card,#fff)',border:'1px solid rgba(15,23,42,.08)',borderRadius:28,padding:'32px 28px',boxShadow:'0 24px 70px rgba(15,23,42,.10)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}><div style={{display:'flex',alignItems:'center',gap:10,fontWeight:800,fontSize:18}}><span className="lp-logo small"><Sparkles/></span>LifePilot</div><span style={{fontSize:13,fontWeight:700,opacity:.55}}>{step+1}/{steps.length}</span></div>
      <div style={{height:4,borderRadius:999,background:'rgba(15,23,42,.08)',marginBottom:34}}><div style={{height:'100%',width:`${((step+1)/steps.length)*100}%`,borderRadius:999,background:'currentColor',transition:'width .25s ease'}}/></div>
      <div style={{width:56,height:56,borderRadius:18,display:'grid',placeItems:'center',background:'rgba(99,102,241,.10)',marginBottom:20}}><StepIcon size={27}/></div>
      <span className="eyebrow">{steps[step].eyebrow}</span><h1 style={{margin:'8px 0 12px',fontSize:'clamp(30px,7vw,46px)',lineHeight:1.04}}>{steps[step].title}</h1><p className="muted" style={{fontSize:17,lineHeight:1.6,marginBottom:28}}>{steps[step].text}</p>
      {step===1&&<div style={{marginBottom:24}}>{goals.length>0&&<div style={{display:'grid',gap:10,marginBottom:14}}>{goals.slice(0,3).map(g=><div key={g.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',border:'1px solid rgba(15,23,42,.09)',borderRadius:14}}><Check size={17}/><span>{g.title}</span></div>)}</div>}<label style={{display:'block',fontWeight:700,fontSize:14}}>Nuovo obiettivo<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Es. migliorare la mia forma fisica" style={{width:'100%',marginTop:8,padding:'14px 15px',border:'1px solid rgba(15,23,42,.14)',borderRadius:14,fontSize:16,boxSizing:'border-box'}}/></label>{goals.length>0&&<p className="muted" style={{fontSize:13,marginTop:10}}>Hai già obiettivi: puoi continuare senza crearne uno nuovo.</p>}</div>}
      {error&&<div className="msg error" style={{marginBottom:16}}>{error}</div>}
      <button className="primary wide" onClick={next} disabled={busy}>{busy?'Salvataggio…':step===steps.length-1?'Entra in LifePilot':'Continua'}<ArrowRight size={18}/></button>
      {step>0&&<button className="link-btn" onClick={()=>{setError('');setStep(step-1)}} style={{marginTop:10,width:'100%'}}>Indietro</button>}
    </div>
  </div>;
}
