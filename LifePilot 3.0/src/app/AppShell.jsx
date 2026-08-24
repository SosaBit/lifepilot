import React,{createContext,useCallback,useContext,useMemo,useState} from 'react';
import AppRouter,{ROUTES,pathForRoute,routeFromPath,routeFromLegacyLabel} from './AppRouter.jsx';
const NavigationContext=createContext(null);
export const useNavigation=()=>useContext(NavigationContext);
export default function AppShell({children}){
 const [route,setRoute]=useState(()=>routeFromPath());
 const navigate=useCallback(next=>{const raw=String(next||'');const key=raw.startsWith('quiz:')?'quiz':raw.startsWith('focus:')?'focus':routeFromLegacyLabel(raw);window.history.pushState({route:key},'',pathForRoute((raw.startsWith('quiz:')||raw.startsWith('focus:'))?raw:key));setRoute(key)},[]);
 React.useEffect(()=>{const onPop=()=>setRoute(routeFromPath());window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)},[]);
 const value=useMemo(()=>({route,navigate,routes:ROUTES}),[route,navigate]);
 return <NavigationContext.Provider value={value}><AppRouter>{children}</AppRouter></NavigationContext.Provider>;
}
