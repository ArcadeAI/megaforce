/**
 * WebSocket Connection Handlers
 * Handle incoming connections, authentication, and messages
 */

import { auth } from "@megaforce/auth";
import prisma from "@megaforce/db";
import type { WebSocket } from "ws";
import {
	type AuthPayload,
	createWsMessage,
	type JoinRoomPayload,
	type LeaveRoomPayload,
	WS_EVENTS,
	type WsMessage,
} from "./events";
import type { AuthenticatedWebSocket, WsServer } from "./server";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique connection ID
 */
function generateConnectionId(): string {
	return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Send an error message to a client
 */
function sendError(ws: WebSocket, message: string): void {
	try {
		ws.send(
			JSON.stringify(createWsMessage(WS_EVENTS.ERROR, { error: message })),
		);
	} catch (error) {
		console.error("Error sending error message:", error);
	}
}

/**
 * Authenticate a WebSocket connection using a session token
 */
async function authenticateConnection(
	token: string,
): Promise<{ userId: string; user: { id: string; email: string } } | null> {
	try {
		// Verify the session token using better-auth
		const session = await auth.api.getSession({
			headers: {
				authorization: `Bearer ${token}`,
			},
		});

		if (!session?.user?.id) {
			return null;
		}

		return {
			userId: session.user.id,
			user: {
				id: session.user.id,
				email: session.user.email,
			},
		};
	} catch (error) {
		console.error("Authentication error:", error);
		return null;
	}
}

/**
 * Store WebSocket connection in database
 */
async function storeConnection(
	connectionId: string,
	userId: string,
	workspaceId: string,
): Promise<void> {
	try {
		await prisma.webSocketConnection.create({
			data: {
				connectionId,
				userId,
				workspaceId,
			},
		});
	} catch (error) {
		console.error("Error storing connection:", error);
		throw error;
	}
}

/**
 * Remove WebSocket connection from database
 */
async function removeConnection(connectionId: string): Promise<void> {
	try {
		await prisma.webSocketConnection.deleteMany({
			where: { connectionId },
		});
	} catch (error) {
		console.error("Error removing connection:", error);
	}
}

/**
 * Update last ping time for a connection
 */
async function updateLastPing(connectionId: string): Promise<void> {
	try {
		await prisma.webSocketConnection.updateMany({
			where: { connectionId },
			data: { lastPingAt: new Date() },
		});
	} catch (error) {
		console.error("Error updating last ping:", error);
	}
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

/**
 * Handle authentication message
 */
async function handleAuth(
	ws: AuthenticatedWebSocket,
	payload: AuthPayload,
): Promise<void> {
	const authResult = await authenticateConnection(payload.token);

	if (!authResult) {
		sendError(ws, "Authentication failed");
		ws.close(1008, "Authentication failed");
		return;
	}

	// Set user information on the WebSocket
	ws.userId = authResult.userId;

	// For now, we'll use the user's first workspace
	// In a real app, you might want to let the client specify the workspace
	const userWorkspaces = await prisma.workspace.findMany({
		where: { userId: authResult.userId },
		select: { id: true },
		take: 1,
	});

	if (userWorkspaces.length === 0) {
		sendError(ws, "No workspace found for user");
		ws.close(1008, "No workspace found");
		return;
	}

	const workspaceId = userWorkspaces[0].id;

	// Store connection in database
	if (ws.connectionId) {
		await storeConnection(ws.connectionId, authResult.userId, workspaceId);
	}

	// Send success response
	ws.send(
		JSON.stringify(
			createWsMessage(WS_EVENTS.AUTHENTICATED, {
				userId: authResult.userId,
				workspaceId,
			}),
		),
	);

	console.log(
		`Client ${ws.connectionId} authenticated as user ${authResult.userId}`,
	);
}

/**
 * Handle join room message
 */
function handleJoinRoom(
	ws: AuthenticatedWebSocket,
	wsServer: WsServer,
	payload: JoinRoomPayload,
): void {
	if (!ws.userId) {
		sendError(ws, "Not authenticated");
		return;
	}

	const joinedRooms: string[] = [];

	for (const room of payload.rooms) {
		const success = wsServer.joinRoom(ws.connectionId!, room);
		if (success) {
			joinedRooms.push(`${room.type}:${room.id}`);
		}
	}

	ws.send(
		JSON.stringify(
			createWsMessage(WS_EVENTS.ROOMS_JOINED, {
				rooms: joinedRooms,
			}),
		),
	);

	console.log(
		`Client ${ws.connectionId} joined rooms: ${joinedRooms.join(", ")}`,
	);
}

/**
 * Handle leave room message
 */
function handleLeaveRoom(
	ws: AuthenticatedWebSocket,
	wsServer: WsServer,
	payload: LeaveRoomPayload,
): void {
	if (!ws.userId) {
		sendError(ws, "Not authenticated");
		return;
	}

	const leftRooms: string[] = [];

	for (const room of payload.rooms) {
		const roomKey = `${room.type}:${room.id}`;
		const success = wsServer.leaveRoom(ws.connectionId!, roomKey);
		if (success) {
			leftRooms.push(roomKey);
		}
	}

	ws.send(
		JSON.stringify(
			createWsMessage(WS_EVENTS.ROOMS_LEFT, {
				rooms: leftRooms,
			}),
		),
	);

	console.log(`Client ${ws.connectionId} left rooms: ${leftRooms.join(", ")}`);
}

/**
 * Handle ping message
 */
async function handlePing(ws: AuthenticatedWebSocket): Promise<void> {
	// Send pong response
	ws.send(JSON.stringify(createWsMessage(WS_EVENTS.PONG, {})));

	// Update last ping time in database
	if (ws.connectionId) {
		await updateLastPing(ws.connectionId);
	}
}

// ============================================================================
// CONNECTION HANDLER
// ============================================================================

/**
 * Setup WebSocket connection handlers
 */
export function setupConnectionHandlers(wsServer: WsServer): void {
	const wss = wsServer.getServer();

	wss.on("connection", (ws: AuthenticatedWebSocket) => {
		const connectionId = generateConnectionId();
		wsServer.registerClient(connectionId, ws);

		console.log(`New WebSocket connection: ${connectionId}`);

		// Handle messages
		ws.on("message", async (data: Buffer) => {
			try {
				const message: WsMessage = JSON.parse(data.toString());

				switch (message.event) {
					case WS_EVENTS.AUTH:
						await handleAuth(ws, message.payload as AuthPayload);
						break;

					case WS_EVENTS.JOIN_ROOM:
						handleJoinRoom(ws, wsServer, message.payload as JoinRoomPayload);
						break;

					case WS_EVENTS.LEAVE_ROOM:
						handleLeaveRoom(ws, wsServer, message.payload as LeaveRoomPayload);
						break;

					case WS_EVENTS.PING:
						await handlePing(ws);
						break;

					default:
						sendError(ws, `Unknown event type: ${message.event}`);
				}
			} catch (error) {
				console.error("Error handling message:", error);
				sendError(ws, "Invalid message format");
			}
		});

		// Handle pong responses (for server-initiated pings)
		ws.on("pong", () => {
			wsServer.handlePong(connectionId);
		});

		// Handle connection close
		ws.on("close", async () => {
			console.log(`WebSocket connection closed: ${connectionId}`);
			wsServer.unregisterClient(connectionId);
			await removeConnection(connectionId);
		});

		// Handle errors
		ws.on("error", (error: Error) => {
			console.error(`WebSocket error on ${connectionId}:`, error);
		});
	});

	console.log("WebSocket connection handlers set up");
}
