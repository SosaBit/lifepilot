const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  // Stripe is intentionally isolated here so the secret key never reaches the browser.
  // Configure STRIPE_SECRET_KEY and Stripe price IDs in Supabase secrets before enabling payments.
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")

  if (!stripeSecret) {
    return new Response(
      JSON.stringify({ error: "Stripe non configurato. Aggiungi STRIPE_SECRET_KEY nel backend." }),
      { status: 501, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify({ error: "Checkout endpoint pronto: collega qui Stripe Checkout." }),
    { status: 501, headers: { ...cors, "Content-Type": "application/json" } },
  )
})
