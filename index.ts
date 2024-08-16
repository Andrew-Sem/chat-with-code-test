import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "./src/env";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const bot = new Telegraf(env.BOT_TOKEN);

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-pro",
  temperature: 0.1,
  maxRetries: 2,
});

bot.command("start", async (ctx) => {
  const response = await llm.invoke([["human", "Что больше, 9.11 или 9.9"]]);
  ctx.reply(response.content.toString());
});

bot.on(message("text"), async (ctx) => {
  const response = await llm.invoke([["human", ctx.message.text]]);
  ctx.reply(response.content.toString());
});

bot.launch();
