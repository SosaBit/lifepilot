import React,{useEffect,useState} from 'react';
import {ArrowRight,Check,Sparkles,Target,Zap} from 'lucide-react';
import {supabase} from './lib/supabase';

const styles={wrap:{minHeight:'100vh',display:'grid',placeItems:'center',padding:'24px',background:'linear-gradient(180deg,#f7f9fc 0%,#eef2f7 100%)'},card:{width:'min(560px,100%)',background:'#fff',border:'1px solid #e7ebf0',borderRadius:28,padding:'36px 28px',boxShadow:'0 20px 60px rgba(15,23,42,.10)'},logo:{width:48,height:48,borderRadius:16,display:'grid',placeItems:'center',background:'#111827',color:'#fff',marginBottom:20},eyebrow:{fontSize:12,fontWeight:800,letterSpacing:1.4,color:'#64748b'},title:{fontSize:'clamp(30px,7vw,48px)',lineHeight:1.05,margin:'10px 0 12px',letterSpacing:-1.5,color:'#0f172a'},text:{fontSize:17,lineHeight:1.6,color:'#64748b',marginBottom:24},row:{display:'flex',gap:12,marginTop:24},input:{width:'100%',padding:'15px 16px',border:'1px solid #d9dee7',borderRadius:14,fontSize:16,outline:'none',boxSizing:'border-box'},button:{border:0,borderRadius:14,padding:'15px 18px',fontWeight:800,fontSize:15,cursor:'pointer'},primary:{background:'#111827',color:'#fff',flex:1},ghost:{background:'#f1f5f9',color:'#334155'},progress:{display:'flex',gap:6,marginBottom:24},dot:{height:5,flex:1,borderRadius:10,background:'#e2e8f0'},dotActive:{background:'#111827'},feature:{display:'flex',gap:14,alignItems:'flex-start',padding:'14px 0',borderTop:'1px solid #eef2f7'},icon:{width:38,height:38,borderRadius:12,display:'grid',placeItems:'center',background:'#f1f5f9',flex:'0 0 auto'},label:{fontWeight:800,color:'#0f172a'},small:{fontSize:14,lineHeight:1.5,color:'#64748b',marginTop:3}};

export default function OnboardingGate({children}){
  const [state,setState]=useState('loading');
  const [session,setSession]=useState(null);
  const [step,setStep]=useState(0);
  const [name,setName]=useState('');
  const [birthDate,setBirthDate]=useState('');
  const [goal,setGoal]=useState('');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    let alive=true;
    let initialized=false;
    let timer=null;

    const inspect=async(s)=>{
      if(!alive)return;
      if(!s){
        if(!initialized)return;
        setSession(null);setState('ready');return;
      }
      setSession(s);
      const {data:p,error:profileError}=await supabase.from('profiles').select('nickname,birth_date,onboarding_completed').eq('id',s.user.id).maybeSingle();
      if(!alive)return;
      if(profileError){setError(profileError.message||'Non riesco a leggere il profilo.');setState('onboarding');return;}
      if(p?.nickname)setName(p.nickname);
      if(p?.birth_date)setBirthDate(p.birth_date);
      if(p?.onboarding_completed){
        const {count}=await supabase.from('goals').select('id',{count:'exact',head:true}).eq('user_id',s.user.id);
        if(!alive)return;
        if((count||0)>0){setState('ready');return;}
      }
      setState('onboarding');
    };

    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{
      if(!alive)return;
      if(_event==='INITIAL_SESSION'){
        initialized=true;
        inspect(s);
        return;
      }
      if(s)inspect(s);
      else {setSession(null);setState('ready');}
    });

    supabase.auth.getSession().then(({data:{session:s}})=>{
      if(!alive)return;
      if(s){initialized=true;inspect(s);}
      else if(!initialized){
        timer=setTimeout(()=>{if(alive&&!initialized){initialized=true;setState('ready');}},1500);
      }
    });

    return()=>{alive=false;if(timer)clearTimeout(timer);subscription.unsubscribe()};
  },[]);

  if(state==='loading')return <div style={styles.wrap}><div style={styles.card}><div style={styles.logo}><Sparkles size={24}/></div><span style={styles.eyebrow}>LIFEPILOT</span><h1 style={styles.title}>Prepariamo il tuo percorso…</h1></div></div>;
  if(state==='ready')return children;
  if(!session)return children;

  const finish=async()=>{
    setSaving(true);setError('');
    const nickname=name.trim();
    const payload={id:session.user.id,nickname,birth_date:birthDate,onboarding_completed:true};
    const {error:e}=await supabase.from('profiles').upsert(payload,{onConflict:'id'});
    if(e){setError(e.message||'Non riesco a salvare il profilo.');setSaving(false);return;}
    const {error:ge}=await supabase.from('goals').insert({user_id:session.user.id,title:goal.trim(),category:'personale',days:30,daily_minutes:20,priority:2,progress:0,streak:0});
    if(ge){setError(ge.message||'Il profilo è pronto, ma non ho creato il primo obiettivo.');setSaving(false);return;}
    setState('ready');setSaving(false);
  };

  const next=()=>{
    setError('');
    if(step===0&&!name.trim()){setError('Inserisci il nome con cui vuoi essere chiamato.');return;}
    if(step===0&&!birthDate){setError('Inserisci la tua data di nascita.');return;}
    if(step===1&&!goal.trim()){setError('Inserisci almeno un obiettivo.');return;}
    if(step<2)setStep(step+1);else finish();
  };

  return <div style={styles.wrap}><div style={styles.card}>
    <div style={styles.progress}>{[0,1,2].map(i=><div key={i} style={{...styles.dot,...(i<=step?styles.dotActive:{})}}/>)}</div>
    <div style={styles.logo}><Sparkles size={24}/></div>
    {step===0&&<>
      <span style={styles.eyebrow}>BENVENUTO IN LIFEPILOT</span>
      <h1 style={styles.title}>Partiamo da te.</h1>
      <p style={styles.text}>Ci servono due informazioni per preparare correttamente il tuo profilo.</p>
      <label style={{...styles.eyebrow,display:'block',marginBottom:8}}>COME VUOI ESSERE CHIAMATO?</label>
      <input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Il tuo nome" style={styles.input}/>
      <label style={{...styles.eyebrow,display:'block',margin:'18px 0 8px'}}>DATA DI NASCITA</label>
      <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} style={styles.input}/>
    </>}
    {step===1&&<>
      <span style={styles.eyebrow}>IL TUO PRIMO OBIETTIVO</span>
      <h1 style={styles.title}>Cosa vuoi ottenere?</h1>
      <p style={styles.text}>Partiamo da una sola cosa. Potrai aggiungere tutti gli altri obiettivi in seguito.</p>
      <input autoFocus value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Es. trovare un nuovo lavoro" style={styles.input}/>
      <div style={{marginTop:16}}><div style={styles.feature}><div style={styles.icon}><Target size={19}/></div><div><div style={styles.label}>Obiettivo chiaro</div><div style={styles.small}>Un risultato concreto su cui concentrarti.</div></div></div></div>
    </>}
    {step===2&&<>
      <span style={styles.eyebrow}>SEI PRONTO</span>
      <h1 style={styles.title}>Un passo alla volta.</h1>
      <p style={styles.text}>Ora troverai la tua area personale. Da lì potrai gestire obiettivi, piano, attività, Focus e progressi.</p>
      <div style={styles.feature}><div style={styles.icon}><Target size={19}/></div><div><div style={styles.label}>Obiettivi</div><div style={styles.small}>Tieni a fuoco ciò che conta davvero.</div></div></div>
      <div style={styles.feature}><div style={styles.icon}><Check size={19}/></div><div><div style={styles.label}>Piano e attività</div><div style={styles.small}>Trasforma gli obiettivi in azioni quotidiane.</div></div></div>
      <div style={styles.feature}><div style={styles.icon}><Zap size={19}/></div><div><div style={styles.label}>Focus</div><div style={styles.small}>Proteggi il tempo che dedichi al tuo prossimo passo.</div></div></div>
    </>}
    {error&&<div style={{marginTop:16,padding:12,borderRadius:12,background:'#fff1f2',color:'#be123c',fontSize:14}}>{error}</div>}
    <div style={styles.row}>{step>0&&<button type="button" style={{...styles.button,...styles.ghost}} onClick={()=>setStep(step-1)} disabled={saving}>Indietro</button>}<button type="button" style={{...styles.button,...styles.primary}} onClick={next} disabled={saving}>{saving?'Salvataggio…':step<2?'Continua':'Entra in LifePilot'}{!saving&&<ArrowRight size={18} style={{verticalAlign:'middle',marginLeft:8}}/>}</button></div>
  </div></div>;
}
