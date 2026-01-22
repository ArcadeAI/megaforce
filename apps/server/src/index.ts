import { cors } from "@elysiajs/cors";
import { auth } from "@megaforce/auth";
import { env } from "@megaforce/env/server";
import { Elysia } from "elysia";
import {
	generateConnectionId,
	handleClose,
	handleMessage,
	handleOpen,
} from "./websocket/handlers";
import { initWsServer, type WsData } from "./websocket/server";

// Initialize WebSocket server (room/client management)
const wsServer = initWsServer();

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
	.ws("/ws", {
		open(ws) {
			// Initialize connection data on open
			ws.data = {
				connectionId: generateConnectionId(),
				userId: undefined,
				rooms: new Set<string>(),
				isAlive: true,
			};
			handleOpen(ws, wsServer);
		},
		message(ws, message) {
			handleMessage(ws, wsServer, message as string);
		},
		close(ws) {
			handleClose(ws, wsServer);
		},
	})
	.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
		console.log("WebSocket server initialized on ws://localhost:3000/ws");
	});

export type App = typeof app;
