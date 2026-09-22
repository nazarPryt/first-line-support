// Returns all clients, the one with the most recent message (from them or the bot) first.
// Callers must send the project's secret key in the `apikey` header.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ auth: "secret" }, async (_req, ctx) => {
    const { data, error } = await ctx.supabaseAdmin
      .from("clients")
      .select()
      .order("last_message_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }),
};
