import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import AppRouter,{ROUTES,routeFromLegacyLabel} from './AppRouter.jsx';
const NavigationContext=createContext(null);
export const useNavigation=()=>useContext(NavigationContext);
export default function AppShell({children}){
 const [route,setRoute]=useState(()=>routeFromLegacyLabel(document.body?.dataset?.lifepilotRoute||'home'));
 const navigate=useCallback(next=>{const key=routeFromLegacyLabel(next);setRoute(key);window.dispatchEvent(new CustomEvent('lifepilot:route-change',{detail:key}));},[]);
 useEffect(()=>{const onNavigate=e=>navigate(e.detail);const onLegacy=e=>navigate(e.detail);window.addEventListener('lifepilot:navigate',onNavigate);window.addEventListener('lifepilot:legacy-navigate',onLegacy);return()=>{window.removeEventListener('lifepilot:navigate',onNavigate);window.removeEventListener('lifepilot:legacy-navigate',onLegacy)}},[navigate]);
 const value=useMemo(()=>({route,navigate,routes:ROUTES}),[route,navigate]);
 return <NavigationContext.Provider value={value}><AppRouter>{children}</AppRouter></NavigationContext.Provider>;
}
