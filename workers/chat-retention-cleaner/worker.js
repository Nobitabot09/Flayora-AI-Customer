export default {
  async scheduled(controller, env, ctx) {
    const cutoff = new Date().toISOString();
    ctx.waitUntil(env.CHAT_LIBRARY.batch([
      env.CHAT_LIBRARY.prepare("DELETE FROM chat_messages WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE expires_at <= ?)").bind(cutoff),
      env.CHAT_LIBRARY.prepare("DELETE FROM chat_conversations WHERE expires_at <= ?").bind(cutoff)
    ]));
  }
};