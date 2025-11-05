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
    open_game: "Открыть игру",
    browser: "Открыть в браузере",
    start: "Добро пожаловать! Нажмите кнопку, чтобы открыть игру.",
    start_no_https: "Для кнопки WebApp нужен HTTPS. Используйте ссылку ниже.",
    help: ["/start — открыть игру","/ping — проверить задержку","/lang — выбрать язык (RU/EN)"].join("\n"),
    lang_choose: "Выберите язык интерфейса",
    lang_set: (l: string) => `Язык установлен: ${l.toUpperCase()}`,
    pong: (ms: number) => `понг • ${ms} мс`,
  },
  en: {
    open_game: "Open game",
    browser: "Open in browser",
    start: "Welcome! Tap the button to open the game.",
    start_no_https: "HTTPS is required for the in-Telegram web_app button. Use the browser link below.",
    help: ["/start - open game","/ping - check latency","/lang - choose language (RU/EN)"].join("\n"),
    lang_choose: "Choose language",
    lang_set: (l: string) => `Language set: ${l.toUpperCase()}`,
    pong: (ms: number) => `pong • ${ms} ms`,
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
const stop = async (signal: string) => { logger.info({ signal }, "Stopping bot…"); await bot.stop(); process.exit(0); };
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

