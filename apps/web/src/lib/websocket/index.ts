/**
 * WebSocket Client and Hooks
 * Centralized exports for WebSocket functionality
 */

// Client
export {
	WebSocketClient,
	getWebSocketClient,
	resetWebSocketClient,
	ConnectionState,
	type WebSocketClientConfig,
} from "./client";

// Events
export {
	WS_EVENTS,
	RoomType,
	createWsMessage,
	getRoomKey,
	parseRoomKey,
	type WsEventType,
	type WsMessage,
	type RoomIdentifier,
	type CandidateStatus,
	type JobType,
	type AuthPayload,
	type AuthenticatedPayload,
	type JoinRoomPayload,
	type LeaveRoomPayload,
	type RoomsJoinedPayload,
	type RoomsLeftPayload,
	type ContentCandidateCreatedPayload,
	type ContentCandidateUpdatedPayload,
	type ContentCandidateStatusChangedPayload,
	type JobCreatedPayload,
	type JobStartedPayload,
	type JobProgressPayload,
	type JobCompletedPayload,
	type JobFailedPayload,
	type SourceCreatedPayload,
	type SourceUpdatedPayload,
	type SourceParsedPayload,
	type ProjectUpdatedPayload,
	type WorkspaceUpdatedPayload,
	type ErrorPayload,
	type EventPayload,
} from "./events";

// Hooks
export {
	useWebSocket,
	useRealtimeUpdates,
	useWebSocketEvent,
	useRoomSubscription,
	type UseWebSocketReturn,
	type UseRealtimeUpdatesOptions,
	type UseWebSocketEventOptions,
	type UseRoomSubscriptionOptions,
} from "./hooks";
