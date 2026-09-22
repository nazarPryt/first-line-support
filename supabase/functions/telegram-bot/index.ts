// Telegram webhook endpoint. Telegram POSTs every update here; grammY routes it to the handlers below.
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { Bot, type Context, webhookCallback } from "grammy";

// Secret key bypasses RLS: the clients/messages tables have no policies, only Edge Functions write to them.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"],
);

type BotContext = Context & { clientId: number };

const bot = new Bot<BotContext>(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "");

async function saveMessage(
  clientId: number,
  sender: "client" | "bot",
  telegramMessageId: number,
  text: string | null,
) {
  const { error } = await supabase.from("messages").insert({
    client_id: clientId,
    sender,
    telegram_message_id: telegramMessageId,
    text,
  });
  if (error) throw error;
}

// Every bot reply goes through here so it's logged too.
async function reply(ctx: BotContext, text: string) {
  const sent = await ctx.reply(text);
  await saveMessage(ctx.clientId, "bot", sent.message_id, text);
}

// Runs before the handlers: turns the sender into a client (or refreshes their name) and logs the message.
bot.on("message", async (ctx, next) => {
  const { data, error } = await supabase
    .from("clients")
    .upsert(
      {
        telegram_user_id: ctx.from.id,
        username: ctx.from.username ?? null,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name ?? null,
      },
      { onConflict: "telegram_user_id" },
    )
    .select("id")
    .single();
  if (error) throw error;

  ctx.clientId = data.id;
  await saveMessage(ctx.clientId, "client", ctx.message.message_id, ctx.message.text ?? ctx.message.caption ?? null);
  await next();
});

bot.command("start", (ctx) =>
  reply(ctx, `Hi ${ctx.from?.first_name ?? "there"}! How can we help you today?`),
);

bot.on("message:text", (ctx) =>
  reply(ctx, "Thanks, we received your message. An operator will get back to you soon."),
);

// Rejects any request whose X-Telegram-Bot-Api-Secret-Token header doesn't match.
const handleUpdate = webhookCallback(bot, "std/http", {
  secretToken: Deno.env.get("TELEGRAM_WEBHOOK_SECRET"),
});

export default {
  async fetch(req: Request): Promise<Response> {
    try {
      return await handleUpdate(req);
    } catch (err) {
      // Answer 200 anyway so Telegram doesn't keep retrying an update that crashes a handler.
      console.error(err);
      return new Response("ok");
    }
  },
};
