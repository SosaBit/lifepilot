import React, { useEffect, useState } from "react";
import { BarChart3, Check, LogOut, Palette, Settings, Trophy, X } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./quick-actions.css";

const THEMES=["violet","ocean","emerald","amber","rose","night"];
const LABELS={violet:"Violet",ocean:"Oceano",emerald:"Smeraldo",amber:"Ambra",rose:"Rosa",night:"Notte"};

export function QuickActions(){
 const [open,setOpen]=useState(null);const [theme,setTheme]=useState(localStorage.getItem("lifepilot-theme")||"violet");const [rows,setRows]=useState([]);const [loading,setLoading]=useState(false);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("lifepilot-theme",theme)},[theme]);
 async function logout(){await supabase.auth.signOut({scope:"local"});window.location.href="/"}
 async function leaderboard(){setOpen("leaderboard");setLoading(true);try{const {data}=await supabase.rpc("get_public_leaderboard");setRows(Array.isArray(data)?data:[])}finally{setLoading(false)}}
 return <>
  <div className="lp-quick-actions"><button aria-label="Classifica" title="Classifica" onClick={leaderboard}><Trophy size={18}/><span>Classifica</span></button><button aria-label="Impostazioni" title="Impostazioni" onClick={()=>setOpen("settings")}><Settings size={18}/><span>Impostazioni</span></button><button aria-label="Logout" title="Logout" onClick={logout}><LogOut size={18}/><span>Logout</span></button></div>
  {open&&<div className="lp-overlay" onMouseDown={e=>e.target===e.currentTarget&&setOpen(null)}><section className="lp-panel"><header><div><span className="eyebrow">{open==="leaderboard"?"CLASSIFICA":"IMPOSTAZIONI"}</span><h2>{open==="leaderboard"?"Le persone più costanti":"Personalizza LifePilot"}</h2></div><button className="lp-close" onClick={()=>setOpen(null)}><X size={20}/></button></header>
   {open==="leaderboard"?<div className="lp-leaderboard">{loading?<p className="muted">Caricamento...</p>:rows.length?rows.map((r,i)=><div className="lp-row" key={r.id||r.user_id||i}><strong>#{i+1}</strong><span>{r.nickname||r.name||"Pilota"}</span><b>{r.points??r.score??0} pt</b></div>):<div className="lp-empty"><Trophy size={24}/><p>La classifica si riempirà quando inizierai a completare i tuoi obiettivi.</p></div>}</div>:<div className="lp-settings"><div className="lp-setting"><div><strong>Tema</strong><span>Personalizza il colore dell'interfaccia.</span></div><Palette size={20}/></div><div className="lp-themes">{THEMES.map(t=><button key={t} className={theme===t?"active":""} onClick={()=>setTheme(t)}><span className={`lp-swatch ${t}`}></span>{LABELS[t]}{theme===t&&<Check size={15}/>}</button>)}</div><button className="lp-logout" onClick={logout}><LogOut size={17}/> Esci dall'account</button></div>}
  </section></div>}
 </>;
}
