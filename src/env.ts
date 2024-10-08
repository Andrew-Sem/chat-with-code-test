import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BOT_TOKEN: z.string().min(1),
    GOOGLE_API_KEY: z.string().min(1),
    WEAVIATE_URL: z.string().min(1),
    WEAVIATE_API_KEY: z.string().min(1),
    GITHUB_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
