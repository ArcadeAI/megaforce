/**
 * WebSocket Connection Handlers
 * Handle incoming connections, authentication, and messages
 */

import prisma from "@megaforce/db";

import { verifyWsToken } from "../routes/ws-auth";
import {
	type AuthPayload,
	createWsMessage,
	type JoinRoomPayload,
	type LeaveRoomPayload,
	WS_EVENTS,
	type WsMessage,
} from "./events";
import type { WsHandle, WsServer } from "./server";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique connection ID
 */
export function generateConnectionId(): string {
	return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Send a message to a WebSocket
 */
// biome-ignore lint/suspicious/noExplicitAny: WsMessage generic needs to accept any payload
function wsSend(ws: WsHandle, message: WsMessage<any>): void {
	try {
		ws.send(JSON.stringify(message));
	} catch (error) {
		console.error("Error sending message:", error);
	}
}

/**
 * Authenticate a WebSocket connection using a WebSocket token
 */
async function authenticateConnection(
	token: string,
): Promise<{ userId: string; email: string } | null> {
	try {
		const userData = verifyWsToken(token);
		if (!userData) {
			console.error("Invalid or expired WebSocket token");
			return null;
		}
		return userData;
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
			data: { connectionId, userId, workspaceId },
		});
	} catch (error) {
		console.error("Error storing connection:", error);
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

async function handleAuth(
	ws: WsHandle,
	wsServer: WsServer,
	connectionId: string,
	payload: AuthPayload,
): Promise<void> {
	const authResult = await authenticateConnection(payload.token);

	if (!authResult) {
		wsSend(
			ws,
			createWsMessage(WS_EVENTS.ERROR, { error: "Authentication failed" }),
		);
		ws.close(1008, "Authentication failed");
		return;
	}

	// Update metadata with user information
	const meta = wsServer.getMeta(connectionId);
	if (meta) {
		meta.userId = authResult.userId;
	}

	// Find user's workspace (optional - user may not have one yet)
	const userWorkspaces = await prisma.workspace.findMany({
		where: { userId: authResult.userId },
		select: { id: true },
		take: 1,
	});

	const workspaceId = userWorkspaces[0]?.id ?? null;

	// Store connection in database if workspace exists (non-fatal if it fails)
	if (workspaceId) {
		await storeConnection(connectionId, authResult.userId, workspaceId);
	}

	// Send success response
	wsSend(
		ws,
		createWsMessage(WS_EVENTS.AUTHENTICATED, {
			userId: authResult.userId,
			workspaceId,
		}),
	);

	console.log(
		`Client ${connectionId} authenticated as user ${authResult.userId}`,
	);
}

function handleJoinRoom(
	ws: WsHandle,
	wsServer: WsServer,
	connectionId: string,
	payload: JoinRoomPayload,
): void {
	const meta = wsServer.getMeta(connectionId);
	if (!meta?.userId) {
		wsSend(
			ws,
			createWsMessage(WS_EVENTS.ERROR, { error: "Not authenticated" }),
		);
		return;
	}

	const joinedRooms: string[] = [];
	for (const room of payload.rooms) {
		if (wsServer.joinRoom(connectionId, room)) {
			joinedRooms.push(`${room.type}:${room.id}`);
		}
	}

	wsSend(ws, createWsMessage(WS_EVENTS.ROOMS_JOINED, { rooms: joinedRooms }));
	console.log(`Client ${connectionId} joined rooms: ${joinedRooms.join(", ")}`);
}

function handleLeaveRoom(
	ws: WsHandle,
	wsServer: WsServer,
	connectionId: string,
	payload: LeaveRoomPayload,
): void {
	const meta = wsServer.getMeta(connectionId);
	if (!meta?.userId) {
		wsSend(
			ws,
			createWsMessage(WS_EVENTS.ERROR, { error: "Not authenticated" }),
		);
		return;
	}

	const leftRooms: string[] = [];
	for (const room of payload.rooms) {
		const roomKey = `${room.type}:${room.id}`;
		if (wsServer.leaveRoom(connectionId, roomKey)) {
			leftRooms.push(roomKey);
		}
	}

	wsSend(ws, createWsMessage(WS_EVENTS.ROOMS_LEFT, { rooms: leftRooms }));
	console.log(`Client ${connectionId} left rooms: ${leftRooms.join(", ")}`);
}

async function handlePing(ws: WsHandle, connectionId: string): Promise<void> {
	wsSend(ws, createWsMessage(WS_EVENTS.PONG, {}));
	await updateLastPing(connectionId);
}

// ============================================================================
// LIFECYCLE HANDLERS
// ============================================================================

/**
 * Handle WebSocket connection open
 */
export function handleOpen(
	ws: WsHandle,
	wsServer: WsServer,
	connectionId: string,
): void {
	wsServer.registerClient(connectionId, ws);
	console.log(`New WebSocket connection: ${connectionId}`);
}

/**
 * Handle WebSocket connection close
 */
export async function handleClose(
	_ws: WsHandle,
	wsServer: WsServer,
	connectionId: string,
): Promise<void> {
	console.log(`WebSocket connection closed: ${connectionId}`);
	wsServer.unregisterClient(connectionId);
	await removeConnection(connectionId);
}

/**
 * Handle incoming WebSocket message
 * connectionId is resolved by the caller (from ws.data) since Elysia creates
 * different wrapper objects for each callback.
 */
export async function handleMessage(
	ws: WsHandle,
	wsServer: WsServer,
	data: unknown,
	connectionId: string,
): Promise<void> {
	try {
		let message: WsMessage;
		if (typeof data === "string") {
			message = JSON.parse(data);
		} else if (typeof data === "object" && data !== null && "event" in data) {
			message = data as WsMessage;
		} else {
			message = JSON.parse(String(data));
		}

		switch (message.event) {
			case WS_EVENTS.AUTH: {
				await handleAuth(
					ws,
					wsServer,
					connectionId,
					message.payload as AuthPayload,
				);
				break;
			}

			case WS_EVENTS.JOIN_ROOM: {
				handleJoinRoom(
					ws,
					wsServer,
					connectionId,
					message.payload as JoinRoomPayload,
				);
				break;
			}

			case WS_EVENTS.LEAVE_ROOM: {
				handleLeaveRoom(
					ws,
					wsServer,
					connectionId,
					message.payload as LeaveRoomPayload,
				);
				break;
			}

			case WS_EVENTS.PING: {
				await handlePing(ws, connectionId);
				break;
			}

			default: {
				wsSend(
					ws,
					createWsMessage(WS_EVENTS.ERROR, {
						error: `Unknown event type: ${message.event}`,
					}),
				);
			}
		}
	} catch (error) {
		console.error("Error handling message:", error);
		wsSend(
			ws,
			createWsMessage(WS_EVENTS.ERROR, { error: "Invalid message format" }),
		);
	}
}
