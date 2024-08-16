import { env } from "./src/env";
import { Telegraf } from "telegraf";

const bot = new Telegraf(env.BOT_TOKEN);

bot.command("start", (ctx) => ctx.reply("Welcome!"));

bot.launch();
