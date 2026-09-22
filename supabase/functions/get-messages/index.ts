// Returns all messages from all clients, newest first.
// Callers must send the project's secret key in the `apikey` header.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ auth: "secret" }, async (_req, ctx) => {
    const { data, error } = await ctx.supabaseAdmin
      .from("messages")
      .select()
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }),
};
