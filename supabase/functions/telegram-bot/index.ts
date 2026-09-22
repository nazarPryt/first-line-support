// Telegram webhook endpoint. Telegram POSTs every update here; grammY routes it to the handlers below.
import "@supabase/functions-js/edge-runtime.d.ts";
import { Bot, webhookCallback } from "grammy";

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "");

bot.command("start", (ctx) =>
  ctx.reply(`Hi ${ctx.from?.first_name ?? "there"}! How can we help you today?`),
);

bot.on("message:text", (ctx) =>
  ctx.reply("Thanks, we received your message. An operator will get back to you soon."),
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
