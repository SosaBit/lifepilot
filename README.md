# LifePilot

LifePilot è una webapp responsive che trasforma un obiettivo in un piano d'azione quotidiano, con check-in, progressi, streak e condivisione.

## Architettura

- `src/` contiene la UI React e la logica frontend.
- `src/lib/` contiene i client esterni.
- `src/services/` contiene chiamate API/auth, senza segreti nel browser.
- `supabase/functions/` contiene backend server-side.
- `supabase/schema.sql` contiene il database iniziale.
- Nessuna chiave segreta deve essere inserita in React/Vite o committata in Git.

## Avvio locale

```bash
npm install
npm run dev
```

## Variabili frontend

Copia `.env.example` in `.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Le variabili `OPENAI_API_KEY` e `STRIPE_SECRET_KEY` devono stare SOLO lato backend (Supabase Edge Functions), mai in `VITE_*`.

## Backend AI

La Edge Function `generate-plan` usa `OPENAI_API_KEY` e genera un piano JSON strutturato.

In Supabase:
```bash
supabase functions deploy generate-plan
supabase secrets set OPENAI_API_KEY=...
```

Non incollare mai la chiave in questo repository.

## Database

Esegui `supabase/schema.sql` nel database Supabase.

## Stripe

La funzione `create-checkout` è il punto server-side per collegare Stripe. Prima di abilitarla, configurare `STRIPE_SECRET_KEY` e i Price ID come secrets.

## Deployment

Frontend: Vercel.

Backend/auth/database: Supabase.

## Regole tecniche adottate

- componenti separati, non un HTML monolitico;
- segreti solo lato server;
- fallback demo con `localStorage`;
- responsive desktop/tablet/smartphone da subito;
- API isolate dai componenti UI;
- database con Row Level Security;
- edge functions indipendenti;
- build riproducibile con Vite;
- niente dipendenza da codice JobPilot.
