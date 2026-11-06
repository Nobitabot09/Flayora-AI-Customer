interface Env { FLAYORA_KNOWLEDGE: D1Database }
type KnowledgeRow = { id: string; title: string; content: string; category: string; status: string; created_at: string; updated_at: string };
function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function sameOrigin(request: Request) { const origin=request.headers.get("Origin"); if(!origin)return true; try{return new URL(origin).host===new URL(request.url).host}catch{return false} }
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!sameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);
  if (!env.FLAYORA_KNOWLEDGE) return json({ error: "Knowledge database is not configured." }, 503);
  try {
    if (request.method === "GET") {
      const result = await env.FLAYORA_KNOWLEDGE.prepare(
        "SELECT id, title, content, category, status, created_at, updated_at FROM ai_knowledge ORDER BY updated_at DESC LIMIT 200"
      ).all<KnowledgeRow>();
      return json({ entries: result.results || [] });
    }
    if (request.method === "POST") {
      const body = await request.json() as { title?: string; content?: string; category?: string };
      const title = typeof body.title === "string" ? body.title.trim().slice(0,120) : "";
      const content = typeof body.content === "string" ? body.content.trim().slice(0,5000) : "";
      const category = typeof body.category === "string" ? body.category.trim().slice(0,40) : "general";
      if (title.length < 3 || content.length < 10) return json({ error: "Add a title and at least 10 characters of knowledge." }, 400);
      const id = crypto.randomUUID(), now = new Date().toISOString();
      await env.FLAYORA_KNOWLEDGE.prepare(
        "INSERT INTO ai_knowledge (id,title,content,category,status,created_at,updated_at) VALUES (?,?,?,?, 'pending', ?,?)"
      ).bind(id,title,content,category || "general",now,now).run();
      return json({ ok:true, entry:{id,title,content,category,status:"pending",created_at:now,updated_at:now} },201);
    }
    if (request.method === "PATCH") {
      const body = await request.json() as { id?: string; action?: string; title?: string; content?: string; category?: string };
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) return json({ error:"Knowledge entry ID is required." },400);
      const now = new Date().toISOString();
      if (body.action === "approve" || body.action === "archive") {
        const status = body.action === "approve" ? "approved" : "archived";
        const result = await env.FLAYORA_KNOWLEDGE.prepare("UPDATE ai_knowledge SET status=?, updated_at=? WHERE id=?").bind(status,now,id).run();
        if (!result.meta.changes) return json({ error:"Entry not found." },404);
        return json({ ok:true,status });
      }
      const title = typeof body.title === "string" ? body.title.trim().slice(0,120) : "";
      const content = typeof body.content === "string" ? body.content.trim().slice(0,5000) : "";
      const category = typeof body.category === "string" ? body.category.trim().slice(0,40) : "general";
      if (title.length < 3 || content.length < 10) return json({ error:"Add a title and at least 10 characters of knowledge." },400);
      const result = await env.FLAYORA_KNOWLEDGE.prepare("UPDATE ai_knowledge SET title=?,content=?,category=?,status='pending',updated_at=? WHERE id=?").bind(title,content,category || "general",now,id).run();
      if (!result.meta.changes) return json({ error:"Entry not found." },404);
      return json({ ok:true,status:"pending" });
    }
    return json({ error:"Method not allowed." },405);
  } catch (error) {
    console.error("Knowledge API error",error);
    return json({ error:"Could not process the knowledge entry." },500);
  }
};
