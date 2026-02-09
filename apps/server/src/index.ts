// Import workers to start processing jobs
import "./jobs/workers/content-generation-worker";
import "./jobs/workers/critic-review-worker";
import "./jobs/workers/outline-generation-worker";
import "./jobs/workers/plan-generation-worker";
import "./jobs/workers/source-ingestion-worker";

import { cors } from "@elysiajs/cors";
import { auth } from "@megaforce/auth";
import { env } from "@megaforce/env/server";
import { Elysia } from "elysia";

import { requireAuth } from "./middleware/auth";
import { handleError } from "./middleware/error-handler";
import { requireWorkspace } from "./middleware/workspace";
import { generationRoutes } from "./routes/generation";
import { outlinesRoutes } from "./routes/outlines";
import { personasRoutes } from "./routes/personas";
import { plansRoutes } from "./routes/plans";
import { sessionWorkflowRoutes } from "./routes/session-workflow";
import { sessionsRoutes } from "./routes/sessions";
import { sourcesRoutes } from "./routes/sources";
import { workspacesRoutes } from "./routes/workspaces";
import { wsAuthRoutes } from "./routes/ws-auth";
import {
	generateConnectionId,
	handleClose,
	handleMessage,
	handleOpen,
} from "./websocket/handlers";
import { initWsServer } from "./websocket/server";

// Initialize WebSocket server (room/client management)
const wsServer = initWsServer();

const app = new Elysia()
	.use(
		cors({
			origin: env.CORS_ORIGIN,
			methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	)
	// Global error handler
	.onError((context) => handleError(context.error as Error, context))
	// Public routes - Better Auth handler
	.onRequest((context) => {
		const url = new URL(context.request.url);
		if (url.pathname.startsWith("/api/auth")) {
			return auth.handler(context.request);
		}
	})
	.get("/", () => "OK")
	// Protected routes - require authentication and workspace
	.group(
		"/api/protected",
		(app) =>
			app
				.derive(async (context) => {
					const user = await requireAuth(context);
					if (user instanceof Response) {
						return { user: null, workspace: null, error: user };
					}
					return { user };
				})
				.derive(async (context) => {
					if (context.error) {
						return context;
					}
					if (!context.user) {
						return context;
					}
					const workspace = await requireWorkspace(context.user);
					if (workspace instanceof Response) {
						return { ...context, workspace: null, error: workspace };
					}
					return { ...context, workspace };
				})
				.onBeforeHandle((context) => {
					if (context.error) {
						return context.error;
					}
				})
				// Example protected route
				.get("/me", (context) => ({
					user: context.user,
					workspace: context.workspace,
				})),
		// Add more protected routes here as needed
	)
	// API Routes
	.use(wsAuthRoutes)
	.use(workspacesRoutes)
	.use(sourcesRoutes)
	.use(personasRoutes)
	.use(sessionsRoutes)
	.use(sessionWorkflowRoutes)
	.use(plansRoutes)
	.use(outlinesRoutes)
	.use(generationRoutes)
	.ws("/ws", {
		open(ws) {
			const connectionId = generateConnectionId();
			// Store connectionId in Elysia's shared WS context so it persists
			// across open/message/close callbacks (which use different wrapper objects)
			// biome-ignore lint/suspicious/noExplicitAny: Elysia WS data typing
			(ws.data as any).__connectionId = connectionId;
			handleOpen(ws, wsServer, connectionId);
		},
		message(ws, message: unknown) {
			// biome-ignore lint/suspicious/noExplicitAny: Elysia WS data typing
			const connectionId = (ws.data as any)?.__connectionId as
				| string
				| undefined;
			if (!connectionId) {
				console.warn("No connectionId on ws.data in message handler");
				return;
			}
			handleMessage(ws, wsServer, message, connectionId);
		},
		close(ws) {
			// biome-ignore lint/suspicious/noExplicitAny: Elysia WS data typing
			const connectionId = (ws.data as any)?.__connectionId as
				| string
				| undefined;
			if (!connectionId) {
				console.warn("No connectionId on ws.data in close handler");
				return;
			}
			handleClose(ws, wsServer, connectionId);
		},
	})
	.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
		console.log("WebSocket server initialized on ws://localhost:3000/ws");
	});

export type App = typeof app;
