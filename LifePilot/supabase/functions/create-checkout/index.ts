import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const MONTHLY_PRICE='price_1U72pCP3t9BFmiMLkJIMwF77';
const ANNUAL_PRICE='price_1U7DE6P3t9BFmiMLJa1G26c1';

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  try{
    const stripeKey=Deno.env.get('STRIPE_SECRET_KEY');
    if(!stripeKey) throw new Error('Billing non ancora configurato: manca STRIPE_SECRET_KEY.');
    const auth=req.headers.get('Authorization');
    if(!auth) throw new Error('Non autenticato.');
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
    const {data:{user},error}=await supabase.auth.getUser();
    if(error||!user) throw new Error('Sessione non valida.');
    const body=await req.json().catch(()=>({}));
    const plan=body.plan==='annual'?'annual':'monthly';
    const price=plan==='annual'?ANNUAL_PRICE:MONTHLY_PRICE;
    const origin=new URL(req.url).origin;
    const form=new URLSearchParams({mode:'subscription',success_url:`${origin}/?billing=success`,cancel_url:`${origin}/?billing=cancelled`,customer_email:user.email||'',client_reference_id:user.id,allow_promotion_codes:'true','line_items[0][price]':price,'line_items[0][quantity]':'1','subscription_data[metadata][user_id]':user.id,'subscription_data[metadata][plan]':plan});
    const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${stripeKey}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error?.message||'Stripe Checkout non disponibile.');
    return new Response(JSON.stringify({url:data.url,session_id:data.id}),{headers:cors});
  }catch(e){return new Response(JSON.stringify({error:e instanceof Error?e.message:'Errore checkout'}),{status:400,headers:cors})}
});
