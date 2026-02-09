import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load root .env first, then apps/server/.env (which takes priority)
dotenv.config({ path: "../../.env" });
dotenv.config({ path: "../../apps/server/.env", override: true });

export default defineConfig({
	schema: path.join("prisma", "schema"),
	migrations: {
		path: path.join("prisma", "migrations"),
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
});
