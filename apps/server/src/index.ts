import { cors } from "@elysiajs/cors";
import { auth } from "@megaforce/auth";
import { env } from "@megaforce/env/server";
import { Elysia } from "elysia";
import { setupConnectionHandlers } from "./websocket/handlers";
import { initWsServer } from "./websocket/server";

const app = new Elysia()
	.use(
		cors({
			origin: env.CORS_ORIGIN,
			methods: ["GET", "POST", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	)
	.all("/api/auth/*", async (context) => {
		const { request, status } = context;
		if (["POST", "GET"].includes(request.method)) {
			return auth.handler(request);
		}
		return status(405);
	})
	.get("/", () => "OK")
	.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});

// Initialize WebSocket server
const server = app.server;
if (server) {
	const wsServer = initWsServer(server as any);
	setupConnectionHandlers(wsServer);
	console.log("WebSocket server initialized on ws://localhost:3000/ws");
}

export type App = typeof app;
