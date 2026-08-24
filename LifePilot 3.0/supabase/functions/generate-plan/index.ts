import OpenAI from "npm:openai@5.10.2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  try {
    if (!Deno.env.get("OPENAI_API_KEY")) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY non configurata nel backend." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      )
    }

    const body = await req.json()
    const title = String(body.title || "").trim()
    const category = String(body.category || "Produttività").trim()
    const days = Number(body.days || 30)
    const dailyMinutes = Number(body.dailyMinutes || 20)

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Inserisci un obiettivo." }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      )
    }

    const prompt = `
Sei il coach di una app chiamata LifePilot.
Trasforma questo obiettivo in un percorso pratico e realistico.

Obiettivo: ${title}
Categoria: ${category}
Durata: ${days} giorni
Tempo disponibile ogni giorno: ${dailyMinutes} minuti

Restituisci SOLO JSON con questa forma:
{
  "title": "titolo breve",
  "summary": "una frase motivazionale concreta",
  "milestones": [
    {"day": 1, "title": "...", "tasks": ["...", "...", "..."]},
    {"day": 2, "title": "...", "tasks": ["...", "...", "..."]},
    {"day": 3, "title": "...", "tasks": ["...", "...", "..."]}
  ],
  "today": ["...", "...", "..."],
  "success_metric": "...",
  "difficulty": "facile|media|alta"
}

Le azioni devono essere eseguibili, specifiche e compatibili con il tempo disponibile.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Sei un coach pratico. Non fare promesse mediche o finanziarie." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || "{}"
    const result = JSON.parse(content)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Errore nella generazione del piano." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }
})
