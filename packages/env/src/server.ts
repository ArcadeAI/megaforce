import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

// Load root .env first, then local .env (which takes priority)
dotenv.config({ path: "../../.env" });
dotenv.config({ path: ".env", override: true });

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		REDIS_URL: z.string().min(1),
		OPENROUTER_API_KEY: z.string().min(1),
		ARCADE_API_KEY: z.string().min(1),
		ENCRYPTION_KEY: z.string().min(32),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
