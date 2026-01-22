/**
 * WebSocket Server
 * Main WebSocket server setup with room management
 */

import type { Server as HTTPServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { RoomIdentifier, WsMessage } from "./events";
import { getRoomKey } from "./events";

// ============================================================================
// TYPES
// ============================================================================

export type AuthenticatedWebSocket = WebSocket & {
	userId?: string;
	connectionId?: string;
	rooms?: Set<string>;
	isAlive?: boolean;
};

// ============================================================================
// WEBSOCKET SERVER CLASS
// ============================================================================

export class WsServer {
	private wss: WebSocketServer;
	private clients: Map<string, AuthenticatedWebSocket>;
	private rooms: Map<string, Set<string>>; // roomKey -> Set of connectionIds
	private pingInterval: Timer | null;

	constructor(server: HTTPServer) {
		this.wss = new WebSocketServer({ server, path: "/ws" });
		this.clients = new Map();
		this.rooms = new Map();
		this.pingInterval = null;

		this.setupPingInterval();
	}

	/**
	 * Get the underlying WebSocket server instance
	 */
	getServer(): WebSocketServer {
		return this.wss;
	}

	/**
	 * Register a client connection
	 */
	registerClient(connectionId: string, ws: AuthenticatedWebSocket): void {
		ws.connectionId = connectionId;
		ws.rooms = new Set();
		ws.isAlive = true;
		this.clients.set(connectionId, ws);
	}

	/**
	 * Unregister a client connection
	 */
	unregisterClient(connectionId: string): void {
		const ws = this.clients.get(connectionId);
		if (ws?.rooms) {
			// Remove from all rooms
			for (const roomKey of ws.rooms) {
				this.leaveRoom(connectionId, roomKey);
			}
		}
		this.clients.delete(connectionId);
	}

	/**
	 * Get a client by connection ID
	 */
	getClient(connectionId: string): AuthenticatedWebSocket | undefined {
		return this.clients.get(connectionId);
	}

	/**
	 * Join a room
	 */
	joinRoom(connectionId: string, room: RoomIdentifier): boolean {
		const ws = this.clients.get(connectionId);
		if (!ws) return false;

		const roomKey = getRoomKey(room);

		// Add to client's room set
		ws.rooms?.add(roomKey);

		// Add to room's client set
		if (!this.rooms.has(roomKey)) {
			this.rooms.set(roomKey, new Set());
		}
		this.rooms.get(roomKey)?.add(connectionId);

		return true;
	}

	/**
	 * Leave a room
	 */
	leaveRoom(connectionId: string, roomKey: string): boolean {
		const ws = this.clients.get(connectionId);
		if (!ws) return false;

		// Remove from client's room set
		ws.rooms?.delete(roomKey);

		// Remove from room's client set
		const room = this.rooms.get(roomKey);
		if (room) {
			room.delete(connectionId);
			// Clean up empty rooms
			if (room.size === 0) {
				this.rooms.delete(roomKey);
			}
		}

		return true;
	}

	/**
	 * Send a message to a specific client
	 */
	sendToClient(connectionId: string, message: WsMessage): boolean {
		const ws = this.clients.get(connectionId);
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return false;
		}

		try {
			ws.send(JSON.stringify(message));
			return true;
		} catch (error) {
			console.error(`Error sending message to client ${connectionId}:`, error);
			return false;
		}
	}

	/**
	 * Broadcast a message to all clients in a room
	 */
	broadcastToRoom(room: RoomIdentifier, message: WsMessage): number {
		const roomKey = getRoomKey(room);
		const clientIds = this.rooms.get(roomKey);

		if (!clientIds || clientIds.size === 0) {
			return 0;
		}

		let sentCount = 0;
		for (const connectionId of clientIds) {
			if (this.sendToClient(connectionId, message)) {
				sentCount++;
			}
		}

		return sentCount;
	}

	/**
	 * Broadcast a message to all connected clients
	 */
	broadcastToAll(message: WsMessage): number {
		let sentCount = 0;
		for (const [connectionId] of this.clients) {
			if (this.sendToClient(connectionId, message)) {
				sentCount++;
			}
		}
		return sentCount;
	}

	/**
	 * Get all clients in a room
	 */
	getClientsInRoom(room: RoomIdentifier): string[] {
		const roomKey = getRoomKey(room);
		const clientIds = this.rooms.get(roomKey);
		return clientIds ? Array.from(clientIds) : [];
	}

	/**
	 * Get all rooms a client is in
	 */
	getClientRooms(connectionId: string): string[] {
		const ws = this.clients.get(connectionId);
		return ws?.rooms ? Array.from(ws.rooms) : [];
	}

	/**
	 * Get statistics about the server
	 */
	getStats() {
		return {
			totalClients: this.clients.size,
			totalRooms: this.rooms.size,
			clientsPerRoom: Array.from(this.rooms.entries()).map(
				([roomKey, clients]) => ({
					room: roomKey,
					clients: clients.size,
				}),
			),
		};
	}

	/**
	 * Setup ping/pong interval to detect dead connections
	 */
	private setupPingInterval(): void {
		this.pingInterval = setInterval(() => {
			for (const [connectionId, ws] of this.clients) {
				if (ws.isAlive === false) {
					// Connection is dead, terminate it
					console.log(`Terminating dead connection: ${connectionId}`);
					ws.terminate();
					this.unregisterClient(connectionId);
					continue;
				}

				// Mark as not alive and ping
				ws.isAlive = false;
				ws.ping();
			}
		}, 30000); // Ping every 30 seconds
	}

	/**
	 * Handle pong response
	 */
	handlePong(connectionId: string): void {
		const ws = this.clients.get(connectionId);
		if (ws) {
			ws.isAlive = true;
		}
	}

	/**
	 * Close the WebSocket server
	 */
	close(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}

		// Close all client connections
		for (const [connectionId, ws] of this.clients) {
			ws.close();
			this.unregisterClient(connectionId);
		}

		// Close the server
		this.wss.close();
	}
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let wsServerInstance: WsServer | null = null;

/**
 * Initialize the WebSocket server
 */
export function initWsServer(server: HTTPServer): WsServer {
	if (wsServerInstance) {
		throw new Error("WebSocket server already initialized");
	}
	wsServerInstance = new WsServer(server);
	return wsServerInstance;
}

/**
 * Get the WebSocket server instance
 */
export function getWsServer(): WsServer {
	if (!wsServerInstance) {
		throw new Error("WebSocket server not initialized");
	}
	return wsServerInstance;
}

/**
 * Close the WebSocket server
 */
export function closeWsServer(): void {
	if (wsServerInstance) {
		wsServerInstance.close();
		wsServerInstance = null;
	}
}
