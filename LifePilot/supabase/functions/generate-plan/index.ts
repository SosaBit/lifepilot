import OpenAI from "npm:openai@5.10.2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") })

function normalizePlan(result: any, dailyMinutes: number, category: string) {
  const milestones = Array.isArray(result?.milestones) ? result.milestones : []
  const plan: any[] = []

  for (const milestone of milestones) {
    const day = Math.max(1, Number(milestone?.day || 1))
    const milestoneTitle = String(milestone?.title || "Prossimo passo").trim()
    const tasks = Array.isArray(milestone?.tasks) ? milestone.tasks : []

    for (const task of tasks) {
      if (plan.length >= 30) break
      const title = String(task || "").trim()
      if (!title) continue
      plan.push({
        day,
        title,
        minutes: dailyMinutes,
        category,
        milestone: milestoneTitle,
      })
    }
    if (plan.length >= 30) break
  }

  return plan
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY")
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY non configurata nel backend." }), {
        status: 500,
        headers: cors,
      })
    }

    const body = await req.json()
    const title = String(body.title || "").trim()
    const category = String(body.category || "Produttività").trim()
    const days = Math.max(1, Math.min(365, Number(body.days || 30)))
    const dailyMinutes = Math.max(5, Math.min(240, Number(body.dailyMinutes || 20)))

    if (!title) {
      return new Response(JSON.stringify({ error: "Inserisci un obiettivo." }), { status: 400, headers: cors })
    }

    const prompt = `
Sei il Goal Intelligence Coach di LifePilot. Trasforma l'obiettivo dell'utente in un percorso concreto, verificabile e realistico.

OBIETTIVO: ${title}
CATEGORIA: ${category}
DURATA: ${days} giorni
TEMPO DISPONIBILE AL GIORNO: ${dailyMinutes} minuti

REGOLE:
1. Capisci il risultato reale che l'utente vuole ottenere.
2. Se l'obiettivo è generico (es. "trovare lavoro", "mettermi in forma", "imparare inglese", "risparmiare", "aprire un'attività"), NON creare una checklist generica.
3. Per obiettivi generici usa assunzioni ragionevoli e dichiarale. Non inventare dati personali.
4. Organizza il percorso in fasi progressive: target, preparazione, esecuzione, misurazione e revisione quando applicabile.
5. Ogni task deve essere un'azione osservabile completabile in una singola sessione.
6. Rendi le azioni misurabili usando numeri quando utile.
7. Ogni attività deve avere un risultato concreto.
8. Non fare promesse eccessive.
9. Se servono informazioni personali, inseriscile in personalization_questions senza bloccare il primo piano.
10. Il piano deve essere utile già dal primo giorno.
11. Produci massimo 30 task totali.

Per "trovare lavoro", privilegia: definire 1-2 ruoli target, identificare competenze richieste e gap, preparare CV/LinkedIn, creare candidature mirate, costruire una lista di aziende, networking e monitoraggio delle candidature. Non assumere settore, città, esperienza o tipo di contratto.

Restituisci SOLO JSON:
{
  "title": "titolo specifico orientato al risultato",
  "summary": "percorso spiegato in una frase",
  "assumptions": ["assunzione ragionevole"],
  "personalization_questions": ["domanda breve e utile"],
  "milestones": [
    {"day": 1, "title": "fase", "tasks": ["azione concreta", "azione concreta"]}
  ],
  "today": ["azione concreta da fare oggi"],
  "success_metric": "metrica verificabile",
  "difficulty": "facile|media|alta"
}

Distribuisci le milestone lungo i ${days} giorni senza rendere i task troppo grandi per ${dailyMinutes} minuti al giorno.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Sei un coach pratico e goal architect. Sii concreto, progressivo e realistico. Non fare promesse mediche o finanziarie.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.55,
    })

    const content = completion.choices[0]?.message?.content || "{}"
    const result = JSON.parse(content)
    const plan = normalizePlan(result, dailyMinutes, category)

    if (!plan.length) {
      return new Response(JSON.stringify({ error: "L'AI ha restituito un piano vuoto. Riprova." }), {
        status: 502,
        headers: cors,
      })
    }

    return new Response(
      JSON.stringify({
        ...result,
        plan,
        source: "openai",
        version: "goal-intelligence-v2",
      }),
      { status: 200, headers: cors },
    )
  } catch (error) {
    console.error("generate-plan error", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore nella generazione del piano." }),
      { status: 500, headers: cors },
    )
  }
})
