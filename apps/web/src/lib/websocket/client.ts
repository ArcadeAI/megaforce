/**
 * WebSocket Client
 * Manages WebSocket connection to Elysia server with auto-reconnect
 */

import { env } from "@megaforce/env/web";

import type {
	AuthPayload,
	JoinRoomPayload,
	LeaveRoomPayload,
	RoomIdentifier,
	WsEventType,
	WsMessage,
} from "./events";
import { createWsMessage, WS_EVENTS } from "./events";

export enum ConnectionState {
	DISCONNECTED = "DISCONNECTED",
	CONNECTING = "CONNECTING",
	CONNECTED = "CONNECTED",
	AUTHENTICATING = "AUTHENTICATING",
	AUTHENTICATED = "AUTHENTICATED",
	RECONNECTING = "RECONNECTING",
	ERROR = "ERROR",
}

export interface WebSocketClientConfig {
	url?: string;
	autoReconnect?: boolean;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
	heartbeatInterval?: number;
}

type EventListener = (message: WsMessage) => void;
type StateChangeListener = (state: ConnectionState) => void;

export class WebSocketClient {
	private ws: WebSocket | null = null;
	private config: Required<WebSocketClientConfig>;
	private state: ConnectionState = ConnectionState.DISCONNECTED;
	private eventListeners = new Map<WsEventType, Set<EventListener>>();
	private stateListeners = new Set<StateChangeListener>();
	private reconnectAttempts = 0;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private token: string | null = null;
	private subscribedRooms: RoomIdentifier[] = [];

	constructor(config: WebSocketClientConfig = {}) {
		// Convert HTTP URL to WebSocket URL
		const serverUrl = config.url || env.VITE_SERVER_URL;
		const wsUrl = serverUrl.replace(/^http/, "ws");

		this.config = {
			url: `${wsUrl}/ws`,
			autoReconnect: config.autoReconnect ?? true,
			reconnectInterval: config.reconnectInterval ?? 3000,
			maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
			heartbeatInterval: config.heartbeatInterval ?? 30_000,
		};
	}

	// ============================================================================
	// Connection Management
	// ============================================================================

	/**
	 * Connect to WebSocket server and authenticate
	 */
	public connect(token: string): void {
		if (
			this.state === ConnectionState.CONNECTED ||
			this.state === ConnectionState.CONNECTING ||
			this.state === ConnectionState.AUTHENTICATING ||
			this.state === ConnectionState.AUTHENTICATED
		) {
			console.warn("WebSocket is already connected or connecting");
			return;
		}

		this.token = token;
		this.setState(ConnectionState.CONNECTING);
		this.reconnectAttempts = 0;

		try {
			this.ws = new WebSocket(this.config.url);
			this.setupEventHandlers();
		} catch (error) {
			console.error("Failed to create WebSocket connection:", error);
			this.setState(ConnectionState.ERROR);
			this.scheduleReconnect();
		}
	}

	/**
	 * Disconnect from WebSocket server
	 */
	public disconnect(): void {
		this.config.autoReconnect = false;
		this.clearReconnectTimeout();
		this.clearHeartbeat();

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.setState(ConnectionState.DISCONNECTED);
		this.token = null;
		this.subscribedRooms = [];
	}

	/**
	 * Get current connection state
	 */
	public getState(): ConnectionState {
		return this.state;
	}

	/**
	 * Check if client is connected and authenticated
	 */
	public isAuthenticated(): boolean {
		return this.state === ConnectionState.AUTHENTICATED;
	}

	// ============================================================================
	// Event Handlers
	// ============================================================================

	private setupEventHandlers(): void {
		if (!this.ws) {
			return;
		}

		this.ws.addEventListener("open", () => {
			console.log("WebSocket connected");
			this.setState(ConnectionState.CONNECTED);
			this.reconnectAttempts = 0;
			this.authenticate();
		});

		this.ws.onmessage = (event) => {
			try {
				const message: WsMessage = JSON.parse(event.data);
				this.handleMessage(message);
			} catch (error) {
				console.error("Failed to parse WebSocket message:", error);
			}
		};

		this.ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			this.setState(ConnectionState.ERROR);
		};

		this.ws.addEventListener("close", (event) => {
			console.log("WebSocket closed:", event.code, event.reason);
			this.clearHeartbeat();

			// Don't reconnect on intentional closes (policy violation / auth failure)
			const noRetryCodes = [1008, 1000];
			if (
				this.config.autoReconnect &&
				!noRetryCodes.includes(event.code) &&
				this.reconnectAttempts < this.config.maxReconnectAttempts
			) {
				this.scheduleReconnect();
			} else {
				this.setState(ConnectionState.DISCONNECTED);
			}
		});
	}

	private handleMessage(message: WsMessage): void {
		// Handle connection-related events
		switch (message.event) {
			case WS_EVENTS.AUTHENTICATED: {
				this.setState(ConnectionState.AUTHENTICATED);
				this.startHeartbeat();
				this.resubscribeToRooms();
				break;
			}

			case WS_EVENTS.PONG: {
				// Heartbeat response received
				break;
			}

			case WS_EVENTS.ERROR: {
				console.error("WebSocket error event:", message.payload);
				break;
			}
		}

		// Notify event listeners
		const listeners = this.eventListeners.get(message.event);
		if (listeners) {
			for (const listener of listeners) {
				listener(message);
			}
		}
	}

	// ============================================================================
	// Authentication
	// ============================================================================

	private authenticate(): void {
		if (!this.token) {
			console.error("Cannot authenticate: no token provided");
			return;
		}

		this.setState(ConnectionState.AUTHENTICATING);
		const authMessage = createWsMessage<AuthPayload>(WS_EVENTS.AUTH, {
			token: this.token,
		});
		this.send(authMessage);
	}

	// ============================================================================
	// Room Management
	// ============================================================================

	/**
	 * Join one or more rooms
	 */
	public joinRooms(rooms: RoomIdentifier[]): void {
		if (!this.isAuthenticated()) {
			console.warn("Cannot join rooms: not authenticated");
			return;
		}

		// Add to subscribed rooms list
		for (const room of rooms) {
			const exists = this.subscribedRooms.some(
				(r) => r.type === room.type && r.id === room.id,
			);
			if (!exists) {
				this.subscribedRooms.push(room);
			}
		}

		const message = createWsMessage<JoinRoomPayload>(WS_EVENTS.JOIN_ROOM, {
			rooms,
		});
		this.send(message);
	}

	/**
	 * Leave one or more rooms
	 */
	public leaveRooms(rooms: RoomIdentifier[]): void {
		if (!this.isAuthenticated()) {
			console.warn("Cannot leave rooms: not authenticated");
			return;
		}

		// Remove from subscribed rooms list
		this.subscribedRooms = this.subscribedRooms.filter(
			(subRoom) =>
				!rooms.some((r) => r.type === subRoom.type && r.id === subRoom.id),
		);

		const message = createWsMessage<LeaveRoomPayload>(WS_EVENTS.LEAVE_ROOM, {
			rooms,
		});
		this.send(message);
	}

	/**
	 * Resubscribe to all rooms after reconnection
	 */
	private resubscribeToRooms(): void {
		if (this.subscribedRooms.length > 0) {
			console.log("Resubscribing to rooms:", this.subscribedRooms);
			const message = createWsMessage<JoinRoomPayload>(WS_EVENTS.JOIN_ROOM, {
				rooms: this.subscribedRooms,
			});
			this.send(message);
		}
	}

	// ============================================================================
	// Message Sending
	// ============================================================================

	/**
	 * Send a message to the server
	 */
	public send<T>(message: WsMessage<T>): void {
		if (this.ws?.readyState !== WebSocket.OPEN) {
			console.warn("Cannot send message: WebSocket is not open");
			return;
		}

		try {
			this.ws.send(JSON.stringify(message));
		} catch (error) {
			console.error("Failed to send WebSocket message:", error);
		}
	}

	// ============================================================================
	// Event Listeners
	// ============================================================================

	/**
	 * Add an event listener for specific event type
	 */
	public on(event: WsEventType, listener: EventListener): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)?.add(listener);

		// Return unsubscribe function
		return () => {
			this.off(event, listener);
		};
	}

	/**
	 * Remove an event listener
	 */
	public off(event: WsEventType, listener: EventListener): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.delete(listener);
		}
	}

	/**
	 * Add a connection state change listener
	 */
	public onStateChange(listener: StateChangeListener): () => void {
		this.stateListeners.add(listener);

		// Return unsubscribe function
		return () => this.stateListeners.delete(listener);
	}

	// ============================================================================
	// State Management
	// ============================================================================

	private setState(newState: ConnectionState): void {
		if (this.state !== newState) {
			console.log(`WebSocket state: ${this.state} -> ${newState}`);
			this.state = newState;
			for (const listener of this.stateListeners) {
				listener(newState);
			}
		}
	}

	// ============================================================================
	// Reconnection Logic
	// ============================================================================

	private scheduleReconnect(): void {
		if (this.reconnectTimeout) {
			return;
		}

		this.reconnectAttempts++;
		this.setState(ConnectionState.RECONNECTING);

		// Exponential backoff with jitter
		const delay =
			Math.min(
				this.config.reconnectInterval * 2 ** (this.reconnectAttempts - 1),
				30_000,
			) +
			Math.random() * 1000;

		console.log(
			`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${Math.round(delay)}ms`,
		);

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			if (this.token) {
				this.connect(this.token);
			}
		}, delay);
	}

	private clearReconnectTimeout(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}

	// ============================================================================
	// Heartbeat
	// ============================================================================

	private startHeartbeat(): void {
		this.clearHeartbeat();

		this.heartbeatInterval = setInterval(() => {
			if (this.isAuthenticated()) {
				const pingMessage = createWsMessage(WS_EVENTS.PING, {});
				this.send(pingMessage);
			}
		}, this.config.heartbeatInterval);
	}

	private clearHeartbeat(): void {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}
}

// ============================================================================
// Singleton Instance
// ============================================================================

let clientInstance: WebSocketClient | null = null;

/**
 * Get the singleton WebSocket client instance
 */
export function getWebSocketClient(): WebSocketClient {
	if (!clientInstance) {
		clientInstance = new WebSocketClient();
	}
	return clientInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetWebSocketClient(): void {
	if (clientInstance) {
		clientInstance.disconnect();
		clientInstance = null;
	}
}
