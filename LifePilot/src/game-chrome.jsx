import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Coins,Gamepad2,Shield,Star,Sparkles} from 'lucide-react';
import {supabase} from './lib/supabase';
import {useNavigation} from './app/AppShell.jsx';

const AVATARS=[
  ['pilot','🧑‍🚀','Nova'],['fox','🦊','Fox'],['wolf','🐺','Wolf'],['dragon','🐉','Dragon'],
  ['robot','🤖','Bot'],['wizard','🧙','Mage'],['ninja','🥷','Ninja'],['knight','🛡️','Knight'],
];
const avatarOf=k=>AVATARS.find(a=>a[0]===k)||AVATARS[0];

export default function GameChrome(){
  const{route}=useNavigation();
  const[profile,setProfile]=useState(null);
  const[progression,setProgression]=useState(null);
  const[target,setTarget]=useState(null);
  const[profileTarget,setProfileTarget]=useState(null);
  const[busy,setBusy]=useState(false);

  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      const{data:{session}}=await supabase.auth.getSession();
      if(!session)return;
      const[p,pr]=await Promise.all([
        supabase.from('profiles').select('nickname,avatar_key,level,xp,lifecoins').eq('id',session.user.id).maybeSingle(),
        supabase.rpc('get_progression_summary')
      ]);
      if(alive){setProfile(p.data||null);setProgression(pr.data||null)}
    };
    load();
    const{data:{subscription}}=supabase.auth.onAuthStateChange(()=>load());
    return()=>{alive=false;subscription.unsubscribe()};
  },[]);

  useEffect(()=>{
    const scan=()=>{
      setTarget(document.querySelector('.lp-top'));
      setProfileTarget(route==='profile'?document.querySelector('.page'):null);
    };
    scan();
    const observer=new MutationObserver(scan);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[route]);

  if(!profile||!target)return null;
  const level=progression?.level||profile.level||1;
  const into=progression?.xp_into_level||0;
  const next=progression?.xp_for_next_level||250;
  const coins=progression?.lifecoins??profile.lifecoins??0;
  const avatar=avatarOf(profile.avatar_key);
  const pct=Math.min(100,Math.round(into/Math.max(1,next)*100));

  const choose=async key=>{
    if(busy)return;
    setBusy(true);
    const{data,error}=await supabase.from('profiles').update({avatar_key:key}).select('nickname,avatar_key,level,xp,lifecoins').maybeSingle();
    if(!error&&data)setProfile(data);
    setBusy(false);
  };

  const header=createPortal(<div className="game-header-stats" aria-label="Progressione giocatore">
    <div className="game-level-block">
      <div className="game-level-line"><span className="game-level-badge"><Star/> LV {level}</span><strong>{progression?.title||'Novice'}</strong></div>
      <div className="game-xp"><i style={{width:`${pct}%`}}/></div>
      <small>{into} / {next} XP</small>
    </div>
    <div className="game-coins"><Coins/><strong>{coins}</strong><span>LC</span></div>
    <div className="game-avatar-button" title="Avatar"><span>{avatar[1]}</span><small>{avatar[2]}</small></div>
  </div>,target);

  const editor=route==='profile'&&profileTarget?createPortal(<section className="avatar-forge panel">
    <div className="avatar-forge-head"><div><span className="eyebrow">CHARACTER FORGE</span><h2>Scegli il tuo avatar</h2><p className="muted">Il tuo avatar è cosmetico: il tuo progresso resta legato alle attività reali.</p></div><div className="avatar-preview">{avatar[1]}</div></div>
    <div className="avatar-grid">{AVATARS.map(([key,emoji,name])=><button key={key} className={profile.avatar_key===key?'avatar-choice selected':'avatar-choice'} disabled={busy} onClick={()=>choose(key)}><span>{emoji}</span><small>{name}</small>{profile.avatar_key===key&&<b>✓</b>}</button>)}</div>
    <div className="avatar-forge-foot"><Shield/><span>Avatar, titoli e cosmetici non modificano XP, LifeCoins o mastery.</span><Gamepad2/></div>
  </section>,profileTarget):null;
  return <>{header}{editor}</>;
}
