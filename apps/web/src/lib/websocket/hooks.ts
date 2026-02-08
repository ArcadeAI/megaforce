/**
 * React Hooks for WebSocket
 * Provides easy-to-use hooks for WebSocket connection and real-time updates
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ConnectionState, getWebSocketClient } from "./client";
import type { RoomIdentifier, WsEventType, WsMessage } from "./events";

// ============================================================================
// useWebSocket Hook
// ============================================================================

export interface UseWebSocketReturn {
	state: ConnectionState;
	isConnected: boolean;
	isAuthenticated: boolean;
	connect: () => void;
	disconnect: () => void;
	send: <T>(message: WsMessage<T>) => void;
	joinRooms: (rooms: RoomIdentifier[]) => void;
	leaveRooms: (rooms: RoomIdentifier[]) => void;
}

/**
 * Hook for managing WebSocket connection
 * Automatically connects on mount if user is authenticated
 * Uses a ref counter so the singleton client stays alive across component mounts
 */
export function useWebSocket(
	options: { autoConnect?: boolean } = {},
): UseWebSocketReturn {
	const { autoConnect = true } = options;
	const client = getWebSocketClient();
	const [state, setState] = useState<ConnectionState>(client.getState());
	const { data: session } = authClient.useSession();

	// Subscribe to state changes
	useEffect(() => {
		const unsubscribe = client.onStateChange((newState) => {
			setState(newState);
		});

		// Sync state on mount in case it changed while unmounted
		setState(client.getState());

		return unsubscribe;
	}, [client]);

	// Auto-connect when session is available
	useEffect(() => {
		if (
			autoConnect &&
			session?.session &&
			client.getState() === ConnectionState.DISCONNECTED
		) {
			// Fetch WebSocket token from API
			const connectWithToken = async () => {
				try {
					const response = await fetch(
						`${import.meta.env.VITE_SERVER_URL}/api/ws-token`,
						{
							credentials: "include", // Include cookies for auth
						},
					);

					if (!response.ok) {
						console.error("Failed to fetch WebSocket token:", response.status);
						return;
					}

					const data = await response.json();

					if (data.token) {
						console.log("Auto-connecting WebSocket with fetched token");
						client.connect(data.token);
					}
				} catch (error) {
					console.error("Error fetching WebSocket token:", error);
				}
			};

			connectWithToken();
		}
	}, [autoConnect, session, client]);

	const connect = useCallback(async () => {
		try {
			const response = await fetch(
				`${import.meta.env.VITE_SERVER_URL}/api/ws-token`,
				{
					credentials: "include",
				},
			);

			if (!response.ok) {
				console.error("Cannot connect: failed to fetch WebSocket token");
				return;
			}

			const data = await response.json();

			if (data.token) {
				client.connect(data.token);
			}
		} catch (error) {
			console.error("Cannot connect: error fetching WebSocket token", error);
		}
	}, [client]);

	const disconnect = useCallback(() => {
		client.disconnect();
	}, [client]);

	const send = useCallback(
		<T>(message: WsMessage<T>) => {
			client.send(message);
		},
		[client],
	);

	const joinRooms = useCallback(
		(rooms: RoomIdentifier[]) => {
			client.joinRooms(rooms);
		},
		[client],
	);

	const leaveRooms = useCallback(
		(rooms: RoomIdentifier[]) => {
			client.leaveRooms(rooms);
		},
		[client],
	);

	return {
		state,
		isConnected: state === ConnectionState.CONNECTED,
		isAuthenticated: state === ConnectionState.AUTHENTICATED,
		connect,
		disconnect,
		send,
		joinRooms,
		leaveRooms,
	};
}

// ============================================================================
// useRealtimeUpdates Hook
// ============================================================================

export interface UseRealtimeUpdatesOptions<T> {
	event: WsEventType;
	onMessage: (payload: T) => void;
	enabled?: boolean;
}

/**
 * Hook for subscribing to specific WebSocket events
 * Automatically manages event listener lifecycle
 *
 * @example
 * ```tsx
 * useRealtimeUpdates({
 *   event: WS_EVENTS.JOB_PROGRESS,
 *   onMessage: (payload: JobProgressPayload) => {
 *     console.log(`Job ${payload.jobId} progress: ${payload.progress}%`);
 *   },
 * });
 * ```
 */
export function useRealtimeUpdates<T = unknown>(
	options: UseRealtimeUpdatesOptions<T>,
): void {
	const { event, onMessage, enabled = true } = options;
	const client = getWebSocketClient();
	const onMessageRef = useRef(onMessage);

	// Keep callback ref up to date
	useEffect(() => {
		onMessageRef.current = onMessage;
	}, [onMessage]);

	useEffect(() => {
		if (!enabled) return;

		const listener = (message: WsMessage) => {
			onMessageRef.current(message.payload as T);
		};

		const unsubscribe = client.on(event, listener);
		return unsubscribe;
	}, [client, event, enabled]);
}

// ============================================================================
// useWebSocketEvent Hook
// ============================================================================

export interface UseWebSocketEventOptions {
	enabled?: boolean;
}

/**
 * Hook for subscribing to a WebSocket event and storing the latest payload
 * Returns the latest payload and a loading state
 *
 * @example
 * ```tsx
 * const jobProgress = useWebSocketEvent<JobProgressPayload>(
 *   WS_EVENTS.JOB_PROGRESS
 * );
 *
 * if (jobProgress) {
 *   console.log(`Progress: ${jobProgress.progress}%`);
 * }
 * ```
 */
export function useWebSocketEvent<T = unknown>(
	event: WsEventType,
	options: UseWebSocketEventOptions = {},
): T | null {
	const { enabled = true } = options;
	const [payload, setPayload] = useState<T | null>(null);

	useRealtimeUpdates<T>({
		event,
		onMessage: (data) => setPayload(data),
		enabled,
	});

	return payload;
}

// ============================================================================
// useRoomSubscription Hook
// ============================================================================

export interface UseRoomSubscriptionOptions {
	rooms: RoomIdentifier[];
	enabled?: boolean;
}

/**
 * Hook for managing room subscriptions
 * Automatically joins rooms on mount and leaves on unmount
 *
 * @example
 * ```tsx
 * useRoomSubscription({
 *   rooms: [
 *     { type: RoomType.WORKSPACE, id: workspaceId },
 *     { type: RoomType.PROJECT, id: projectId },
 *   ],
 * });
 * ```
 */
export function useRoomSubscription(options: UseRoomSubscriptionOptions): void {
	const { rooms, enabled = true } = options;
	const client = getWebSocketClient();
	const roomsRef = useRef(rooms);

	// Update ref when rooms change
	useEffect(() => {
		roomsRef.current = rooms;
	}, [rooms]);

	useEffect(() => {
		if (!enabled || rooms.length === 0) return;

		// Wait for authentication before joining rooms
		const currentState = client.getState();
		if (currentState !== ConnectionState.AUTHENTICATED) {
			// Listen for authentication
			const unsubscribe = client.onStateChange((state) => {
				if (state === ConnectionState.AUTHENTICATED) {
					client.joinRooms(roomsRef.current);
					unsubscribe();
				}
			});
			return unsubscribe;
		}

		// Already authenticated, join immediately
		client.joinRooms(rooms);

		// Leave rooms on unmount
		return () => {
			client.leaveRooms(roomsRef.current);
		};
	}, [client, rooms, enabled]);
}
