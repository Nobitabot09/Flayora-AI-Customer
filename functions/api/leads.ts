interface Env { FLAYORA_LEADS: D1Database }
function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!sameOrigin(request)) return json({ error: "Cross-origin requests are not allowed." }, 403);
  if (!env.FLAYORA_LEADS) return json({ error: "Enquiry saving is not configured yet. Please contact the team directly." }, 503);
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Please submit a valid enquiry." }, 400); }
  // Honeypot field: silent success to avoid teaching bots the form validation.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\\s()-]/g, "").slice(0, 16) : "";
  const product = typeof body.product === "string" ? body.product.trim().slice(0, 120) : "";
  const requirements = typeof body.requirements === "string" ? body.requirements.trim().slice(0, 3000) : "";
  const consent = body.consent === true;
  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!/^\\+?[0-9]{10,15}$/.test(phone)) return json({ error: "Please enter a valid phone number with country code if needed." }, 400);
  if (product.length < 2 || requirements.length < 8) return json({ error: "Please add the product and a few details about what you need." }, 400);
  if (!consent) return json({ error: "Please confirm that Flayora may contact you about this enquiry." }, 400);
  try {
    const recent = await env.FLAYORA_LEADS.prepare(
      "SELECT COUNT(*) AS total FROM ai_leads WHERE phone = ? AND created_at >= datetime('now', '-5 minutes')"
    ).bind(phone).first<{ total: number }>();
    if ((recent?.total || 0) >= 2) return json({ error: "We already received a recent enquiry from this number. Please wait a few minutes before submitting again." }, 429);
    const id = crypto.randomUUID();
    await env.FLAYORA_LEADS.prepare(
      "INSERT INTO ai_leads (id, created_at, customer_name, phone, product, requirements, preferred_contact, status, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'website-ai')"
    ).bind(id, new Date().toISOString(), name, phone, product, requirements, "WhatsApp").run();
    return json({ ok: true, reference: id.slice(0, 8).toUpperCase(), message: "Your enquiry has been received. The Flayora team can follow up with you." }, 201);
  } catch (error) {
    console.error("AI lead save failed", error);
    return json({ error: "We couldn't save your enquiry just now. Please try again or contact the team directly." }, 500);
  }
};
