import OpenAI from "npm:openai@5.10.2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") })

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    if (!Deno.env.get("OPENAI_API_KEY")) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY non configurata nel backend." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } })
    }

    const body = await req.json()
    const title = String(body.title || "").trim()
    const category = String(body.category || "Produttività").trim()
    const days = Number(body.days || 30)
    const dailyMinutes = Number(body.dailyMinutes || 20)

    if (!title) {
      return new Response(JSON.stringify({ error: "Inserisci un obiettivo." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } })
    }

    const prompt = `
Sei il Goal Intelligence Coach di LifePilot. Il tuo compito non è trasformare una frase generica in una checklist generica: devi trasformarla in un percorso concreto, verificabile e realistico.

OBIETTIVO DELL'UTENTE: ${title}
CATEGORIA: ${category}
DURATA DISPONIBILE: ${days} giorni
TEMPO DISPONIBILE AL GIORNO: ${dailyMinutes} minuti

REGOLE IMPORTANTI:
1. Prima interpreta il vero risultato che l'utente vuole ottenere.
2. Se l'obiettivo è generico (es. "trovare lavoro", "mettermi in forma", "imparare inglese", "risparmiare", "aprire un'attività"), NON produrre attività vaghe come "cerca informazioni", "fai ricerca", "lavora sull'obiettivo" o "inizia a studiare".
3. Per un obiettivo generico, scegli un percorso iniziale sensato e rendilo concreto usando assunzioni esplicite e ragionevoli. Non inventare dati personali dell'utente.
4. Spezza il percorso in fasi progressive: definizione del target, preparazione, esecuzione, misurazione e revisione quando applicabile.
5. Ogni task deve descrivere un'azione osservabile che una persona può completare in una singola sessione e deve essere compatibile con ${dailyMinutes} minuti.
6. Usa numeri quando rendono il task verificabile (es. "scrivi 3 versioni", "invia 2 candidature mirate", "dedica 20 minuti").
7. Collega ogni attività a un risultato concreto e indica come misurare il successo.
8. Evita promesse eccessive. Se mancano informazioni importanti, crea comunque un buon percorso iniziale e segnala le informazioni che LifePilot dovrebbe chiedere in seguito.
9. Adatta il piano alla categoria e al significato dell'obiettivo. "Trovare lavoro" deve diventare un percorso di ricerca occupazionale; "imparare inglese" un percorso di apprendimento; "correre una 10K" un percorso di allenamento, ecc.
10. Il piano deve essere utile già dal primo giorno, senza richiedere all'utente di capire da solo cosa fare.

Per "trovare lavoro", per esempio, privilegia attività come definire 1-2 ruoli target, identificare competenze mancanti, preparare CV/LinkedIn, creare candidature mirate, costruire una lista di aziende, fare networking e monitorare candidature. Non assumere settore, città o esperienza: lascia questi elementi come personalizzazioni da chiarire in seguito.

Restituisci SOLO JSON con questa forma:
{
  "title": "titolo specifico e orientato al risultato",
  "summary": "spiegazione concreta del percorso in una frase",
  "assumptions": ["assunzione ragionevole usata", "informazione che sarebbe utile personalizzare"],
  "personalization_questions": ["domanda breve e utile", "seconda domanda solo se davvero necessaria"],
  "milestones": [
    {"day": 1, "title": "fase concreta", "tasks": ["azione osservabile", "azione osservabile", "azione osservabile"]},
    {"day": 2, "title": "fase concreta", "tasks": ["azione osservabile", "azione osservabile", "azione osservabile"]},
    {"day": 3, "title": "fase concreta", "tasks": ["azione osservabile", "azione osservabile", "azione osservabile"]}
  ],
  "today": ["azione concreta da fare oggi", "seconda azione concreta", "terza azione concreta"],
  "success_metric": "metrica verificabile",
  "difficulty": "facile|media|alta"
}

Non limitarti ai primi tre giorni se ${days} giorni lo rendono utile: crea milestone distribuite lungo il percorso, mantenendo però i task abbastanza piccoli da essere eseguibili. Le azioni devono essere specifiche, progressive, misurabili e compatibili con il tempo disponibile.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Sei un coach pratico e un goal architect. Sii concreto, progressivo e realistico. Non fare promesse mediche o finanziarie." },
        { role: "user", content: prompt },
      ],
      temperature: 0.55,
    })

    const content = completion.choices[0]?.message?.content || "{}"
    const result = JSON.parse(content)

    return new Response(JSON.stringify(result), { status: 200, headers: { ...cors, "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Errore nella generazione del piano." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } })
  }
})
