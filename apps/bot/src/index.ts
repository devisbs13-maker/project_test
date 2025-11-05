import { Bot, InlineKeyboard } from "grammy";
import pino from "pino";
import "dotenv/config";

const logger = pino({ level: process.env.NODE_ENV === "production" ? "info" : "debug" });

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://example.com";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required");
}

const bot = new Bot(BOT_TOKEN);

// Ensure long polling does not conflict with any residual webhook
await bot.api.deleteWebhook({ drop_pending_updates: true }).catch(() => {});

// Simple RU/EN i18n (in-memory)
type Lang = "ru" | "en";
const userLang = new Map<number, Lang>();
const T = {
  ru: {
    open_game: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0433\u0440\u0443",
    browser: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435",
    start: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c! \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043a\u043d\u043e\u043f\u043a\u0443, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0433\u0440\u0443.",
    start_no_https: "\u041d\u0443\u0436\u0435\u043d HTTPS, \u0447\u0442\u043e\u0431\u044b \u043a\u043d\u043e\u043f\u043a\u0430 web_app \u0440\u0430\u0431\u043e\u0442\u0430\u043b\u0430 \u0432 \u0422\u0435\u043b\u0435\u0433\u0440\u0430\u043c. \u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0438\u0436\u0435.",
    help: ["/start \u2014 \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0433\u0440\u0443","/ping \u2014 \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u0437\u0430\u0434\u0435\u0440\u0436\u043a\u0443","/lang \u2014 \u0432\u044b\u0431\u043e\u0440 \u044f\u0437\u044b\u043a\u0430 (RU/EN)"].join("\n"),
    lang_choose: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044f\u0437\u044b\u043a",
    lang_set: (l: string) => `\u042f\u0437\u044b\u043a \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d: ${l.toUpperCase()}`,
    pong: (ms: number) => `pong ${ms} ms`,
  },
  en: {
    open_game: "Open game",
    browser: "Open in browser",
    start: "Welcome! Tap the button to open the game.",
    start_no_https: "HTTPS is required for the in-Telegram web_app button. Use the browser link below.",
    help: ["/start - open game","/ping - check latency","/lang - choose language (RU/EN)"].join("\n"),
    lang_choose: "Choose language",
    lang_set: (l: string) => `Language set: ${l.toUpperCase()}`,
    pong: (ms: number) => `pong in ${ms} ms`,
  },
} as const;
const L = (ctx: any) => T[userLang.get(Number(ctx.from?.id)) || "ru"];

// basic logging
bot.use(async (ctx, next) => {
  logger.debug({ update_id: ctx.update.update_id, from: ctx.from?.id, type: Object.keys(ctx.update)[0] });
  await next();
});

// error handler
bot.catch((err) => { logger.error({ err }, "Unhandled bot error"); });

// /start
bot.command("start", async (ctx) => {
  const t = L(ctx);
  const url = WEBAPP_URL; const isHttps = /^https:\/\//i.test(url);
  const kb = new InlineKeyboard();
  if (isHttps) kb.add({ text: t.open_game, web_app: { url } } as any).row();
  kb.url(t.browser, url);
  await ctx.reply(isHttps ? t.start : t.start_no_https, { reply_markup: kb });
});

// /help
bot.command("help", async (ctx) => { await ctx.reply(L(ctx).help); });

// /lang
bot.command("lang", async (ctx) => {
  const t = L(ctx);
  const kb = new InlineKeyboard().text("RU", "lang_ru").text("EN", "lang_en");
  await ctx.reply(t.lang_choose, { reply_markup: kb });
});
bot.callbackQuery(["lang_ru","lang_en"], async (ctx) => {
  const uid = Number(ctx.from?.id || 0);
  const code = ctx.callbackQuery.data === "lang_ru" ? "ru" : "en";
  userLang.set(uid, code as Lang);
  await ctx.answerCallbackQuery({ text: T[code as Lang].lang_set(code) });
});

// /ping
bot.command("ping", async (ctx) => {
  const sentAt = (ctx.message?.date ?? Math.floor(Date.now() / 1000)) * 1000;
  await ctx.reply(L(ctx).pong(Date.now() - sentAt));
});

// start (long polling)
bot.start({ onStart: (me) => logger.info(`Bot @${me.username} started (long polling)`) });

// graceful shutdown
const stop = async (signal: string) => { logger.info({ signal }, "Stopping bot..."); await bot.stop(); process.exit(0); };
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

