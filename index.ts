import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import dedent from "ts-dedent";
import { env } from "./src/env";
import { FilesService } from "./src/services/FilesService";
import { GithubService } from "./src/services/GithubService";
import { RetrieveService } from "./src/services/RetrieveService";

const bot = new Telegraf(env.BOT_TOKEN);
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-pro",
  temperature: 0.1,
  maxRetries: 2,
});
const retrieveService = new RetrieveService();
const githubService = new GithubService();
const filesService = new FilesService(githubService);

type UserState = {
  repo: string | null;
  awaitingRepoUrl: boolean;
};

const userStates = new Map<number, UserState>();

bot.command("start", async (ctx) => {
  ctx.reply("Hi! Use /selectrepo to choose a GitHub repository.");
});

bot.command("selectrepo", (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    userStates.set(userId, { repo: null, awaitingRepoUrl: true });
    ctx.reply("Please enter the GitHub repository URL:");
  }
});

bot.command("currentrepo", (ctx) => {
  const userId = ctx.from?.id;
  const userState = userId ? userStates.get(userId) : undefined;
  if (userState?.repo) {
    ctx.reply(`Your current repository is: ${userState.repo}`);
  } else {
    ctx.reply(
      "You haven't selected a repository yet. Use /selectrepo to choose one.",
    );
  }
});

bot.on(message("text"), async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  let userState = userStates.get(userId);
  if (!userState) {
    userState = { repo: null, awaitingRepoUrl: false };
    userStates.set(userId, userState);
  }

  if (userState.awaitingRepoUrl) {
    const repoUrl = ctx.message.text;
    userState.repo = repoUrl;
    userState.awaitingRepoUrl = false;
    const flatRepo = await filesService.generateFileListing(userState.repo);
    retrieveService.addData(flatRepo.join(""));
    ctx.reply(`Repository set to: ${repoUrl}`);
    return;
  }

  if (!userState.repo) {
    ctx.reply("Please select a repository first using /selectrepo");
    return;
  }

  try {
    const answer = await retrieveService.getAnswer(ctx.message.text);

    const systemMessage = dedent`
    You are an AI assistant tasked with answering user questions based on the provided context. Your goal is to provide accurate, relevant, and concise responses.
    Instructions:
    1. Carefully analyze the following relevant chunks of information from provided GithHub repository:
    ${JSON.stringify(
      answer.map((doc) => doc.pageContent),
      null,
      2,
    )}
    2. Use only the information provided in these chunks to formulate your response. Do not use any external knowledge.
    3. If the provided information is insufficient to fully answer the user's question, clearly state this and explain what specific information is missing.
    4. If there are any contradictions in the provided chunks, point them out and explain the discrepancy.
    5. Cite specific chunks when appropriate by referring to them as "according to the provided information" or similar phrasing.
    6. Keep your response concise and to the point, unless the user specifically requests detailed explanations.
    7. If you're unsure about any aspect of the answer, express your uncertainty clearly.
    8. Do not make up or infer information that is not explicitly stated in the provided chunks.
    Remember, your primary goal is to provide accurate and helpful responses based solely on the given context.
    `;

    const response = await llm.invoke([
      ["system", systemMessage],
      ["human", `User query: ${ctx.message.text}`],
    ]);

    ctx.reply(response.content.toString());
  } catch (error) {
    console.error("Error processing request:", error);
    ctx.reply(
      "An error occurred while processing your request. Please try again later.",
    );
  }
});

bot.launch();
