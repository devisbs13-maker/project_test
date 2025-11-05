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
// and drop pending updates to avoid 409 errors when another poller was running
await bot.api.deleteWebhook({ drop_pending_updates: true }).catch(() => {});

// basic logging
bot.use(async (ctx, next) => {
  logger.debug({
    update_id: ctx.update.update_id,
    from: ctx.from?.id,
    type: Object.keys(ctx.update)[0],
  });
  await next();
});

// error handler
bot.catch((err) => {
  logger.error({ err }, "Unhandled bot error");
});

// /start command
bot.command("start", async (ctx) => {
  const url = WEBAPP_URL;
  const isHttps = /^https:\/\//i.test(url);

  const kb = new InlineKeyboard();
  if (isHttps) {
    kb.add({ text: "Open game", web_app: { url } } as any).row();
  }
  kb.url("Open in browser", url);

  const text = isHttps
    ? "Welcome! Tap the button to open the game."
    : "HTTPS is required for the in-Telegram web_app button. Use the browser link below.";
  await ctx.reply(text, { reply_markup: kb });
});

// /help
bot.command("help", async (ctx) => {
  await ctx.reply([
    "/start - open game",
    "/ping - check latency",
    "/clan - my clan info",
    "/clan_top - weekly top clans",
    "/help - this help",
  ].join("\n"));
});

// /top weekly leaderboard via API
bot.command("top", async (ctx) => {
  try {
    const api = process.env.API_URL || 'http://127.0.0.1:4000';
    const res = await fetch(`${api}/leaderboard/weekly?limit=10`);
    const data: any[] = await res.json();
    const lines = [
      'Топ недели:',
      ...data.map((r, i) => `${i+1}) ${r.name}${r.username ? ' @'+r.username : ''} — ${r.score}`)
    ];
    await ctx.reply(lines.join('\n'));
  } catch {
    await ctx.reply('Не удалось получить топ. Проверьте API.');
  }
});

// /clan - my clan info
bot.command("clan", async (ctx) => {
  try {
    const api = process.env.API_URL || 'http://127.0.0.1:4000';
    const uid = String(ctx.from?.id || '');
    const res = await fetch(`${api}/clan/my?userId=${encodeURIComponent(uid)}`);
    const data: any = await res.json();
    if (!data?.clan) { await ctx.reply('Вы не состоите в клане. Откройте WebApp, вкладка Клан.'); return; }
    const clan = data.clan;
    const members = (data.members || []).slice(0, 10).map((m: any) => `• ${m.userId} — ${m.role}`);
    const q = (data.quests || []).map((x: any) => {
      const st = x.state || { progress: 0, completed: 0 };
      return `${x.quest.title}: ${st.progress}/${x.quest.target}${st.completed ? ' ✓' : ''}`;
    });
    const lines = [
      `Клан: ${clan.name} [${clan.tag}]`,
      `Участники (${(data.members || []).length}):`,
      ...members,
      '',
      'Задания:',
      ...q,
      '',
      `Очки за неделю: ${data.weeklyScore ?? 0}`,
    ];
    await ctx.reply(lines.join('\n'));
  } catch {
    await ctx.reply('Не удалось получить клан-инфо.');
  }
});

// /clan_top - weekly top clans
bot.command("clan_top", async (ctx) => {
  try {
    const api = process.env.API_URL || 'http://127.0.0.1:4000';
    const res = await fetch(`${api}/clan/top/weekly?limit=10`);
    const data: any[] = await res.json();
    const lines = [
      'Топ кланов за неделю:',
      ...data.map((r, i) => `${i+1}) ${r.name} [${r.tag}] — ${r.score}`)
    ];
    await ctx.reply(lines.join('\n'));
  } catch {
    await ctx.reply('Не удалось получить топ кланов.');
  }
});

// обработчик данных, присланных из WebApp через Telegram.WebApp.sendData
bot.on('message:web_app_data', async (ctx) => {
  try {
    const payload = JSON.parse((ctx.msg as any).web_app_data?.data || '{}');
    if (payload?.type === 'task_complete') {
      const kind = payload.kind === 'quest' ? 'Квест' : 'Работа';
      const r = payload.reward || {};
      const rewardText = [
        r.gold ? `🪙 ${r.gold}` : null,
        r.xp ? `✨ XP ${r.xp}` : null,
        r.energy ? `⚡ +${r.energy}` : null,
      ].filter(Boolean).join(' • ');
      await ctx.reply(`${kind} завершён: «${payload.title}»\nНаграда готова к получению: ${rewardText || '—'}`);
    } else if (payload?.type === 'reward_claimed') {
      const kind = payload.kind === 'quest' ? 'Квест' : 'Работа';
      const r = payload.reward || {};
      const rewardText = [
        r.gold ? `🪙 ${r.gold}` : null,
        r.xp ? `✨ XP ${r.xp}` : null,
        r.energy ? `⚡ +${r.energy}` : null,
      ].filter(Boolean).join(' • ');
      await ctx.reply(`Забрал награду (${kind} «${payload.title}»): ${rewardText || '—'}`);
    } else if (payload?.type === 'progress_claim') {
      const r = payload.reward || {};
      const text = [
        r.gold ? `🪙 ${r.gold}` : null,
        r.xp ? `✨ ${r.xp} XP` : null,
        r.energy ? `⚡ +${r.energy}` : null,
      ].filter(Boolean).join(' • ');
      await ctx.reply(`Получена награда: ${payload.kind} «${payload.title}» — ${text || '—'}`);
    } else if (payload?.type === 'event_choice') {
      const r = payload.impact || {};
      const rewardText = [
        r.gold ? `🪙 ${r.gold}` : null,
        r.xp ? `✨ XP ${r.xp}` : null,
        r.energy ? `⚡ ${r.energy > 0 ? '+' : ''}${r.energy}` : null,
        r.sociality ? `🤝 ${r.sociality > 0 ? '+' : ''}${r.sociality}` : null,
        r.karma ? `☯️ ${r.karma > 0 ? '+' : ''}${r.karma}` : null,
        r.luck ? `🍀 ${r.luck > 0 ? '+' : ''}${r.luck}` : null,
      ].filter(Boolean).join(' • ');
      await ctx.reply(`Событие: «${payload.title}»\nВыбор: ${payload.choice}\nЭффекты: ${rewardText || '—'}`);
    } else if (payload?.type === 'purchase') {
      await ctx.reply(`Покупка: «${payload.title}» за 🪙 ${payload.price}`);
    } else if (payload?.type === 'sale') {
      await ctx.reply(`Продажа: «${payload.title}» за 🪙 ${payload.price}`);
    } else if (payload?.type === 'energy_full') {
      await ctx.reply('Энергия полная ⚡');
    } else {
      await ctx.reply('Получены данные из игры.');
    }
  } catch (e) {
    await ctx.reply('Не удалось обработать данные из WebApp.');
  }
});

// /ping
bot.command("ping", async (ctx) => {
  const sentAt = (ctx.message?.date ?? Math.floor(Date.now() / 1000)) * 1000;
  await ctx.reply(`pong — ${Date.now() - sentAt} ms`);
});

// start (long polling)
bot.start({
  onStart: (me) => logger.info(`Bot @${me.username} started (long polling)`),
});

// graceful shutdown
const stop = async (signal: string) => {
  logger.info({ signal }, "Stopping bot…");
  await bot.stop();
  process.exit(0);
};
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
