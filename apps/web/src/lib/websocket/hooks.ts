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

	// Fetch a fresh WebSocket token from the API
	const fetchToken = useCallback(async (): Promise<string | null> => {
		try {
			const response = await fetch(
				`${import.meta.env.VITE_SERVER_URL}/api/ws-token`,
				{ credentials: "include" },
			);
			if (!response.ok) {
				return null;
			}
			const data = await response.json();
			return data.token ?? null;
		} catch {
			return null;
		}
	}, []);

	// Subscribe to state changes
	useEffect(() => {
		const unsubscribe = client.onStateChange((newState) => {
			setState(newState);
		});

		// Sync state on mount in case it changed while unmounted
		setState(client.getState());

		return unsubscribe;
	}, [client]);

	// Provide the token fetcher to the client for reconnection
	useEffect(() => {
		client.setTokenProvider(fetchToken);
	}, [client, fetchToken]);

	// Auto-connect when session is available, or reconnect after disconnect
	useEffect(() => {
		if (
			autoConnect &&
			session?.session &&
			client.getState() === ConnectionState.DISCONNECTED
		) {
			const connectWithToken = async () => {
				const token = await fetchToken();
				if (token) {
					client.connect(token);
				}
			};
			connectWithToken();
		}
	}, [autoConnect, session, client, state, fetchToken]);

	const connect = useCallback(async () => {
		const token = await fetchToken();
		if (token) {
			client.connect(token);
		} else {
			console.error("Cannot connect: failed to fetch WebSocket token");
		}
	}, [client, fetchToken]);

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
	const onMessageReference = useRef(onMessage);

	// Keep callback ref up to date
	useEffect(() => {
		onMessageReference.current = onMessage;
	}, [onMessage]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const listener = (message: WsMessage) => {
			onMessageReference.current(message.payload as T);
		};

		return client.on(event, listener);
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
		onMessage: (data) => {
			setPayload(data);
		},
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
	const roomsReference = useRef(rooms);

	// Update ref when rooms change
	useEffect(() => {
		roomsReference.current = rooms;
	}, [rooms]);

	useEffect(() => {
		if (!enabled || rooms.length === 0) {
			return;
		}

		// Wait for authentication before joining rooms
		const currentState = client.getState();
		if (currentState !== ConnectionState.AUTHENTICATED) {
			// Listen for authentication
			const unsubscribe = client.onStateChange((state) => {
				if (state === ConnectionState.AUTHENTICATED) {
					client.joinRooms(roomsReference.current);
					unsubscribe();
				}
			});
			return unsubscribe;
		}

		// Already authenticated, join immediately
		client.joinRooms(rooms);

		// Leave rooms on unmount
		return () => {
			client.leaveRooms(roomsReference.current);
		};
	}, [client, rooms, enabled]);
}
