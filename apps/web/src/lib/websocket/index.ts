/**
 * WebSocket Client and Hooks
 * Centralized exports for WebSocket functionality
 */

// Client
export {
	ConnectionState,
	getWebSocketClient,
	resetWebSocketClient,
	WebSocketClient,
	type WebSocketClientConfig,
} from "./client";

// Events
export {
	type AuthenticatedPayload,
	type AuthPayload,
	type CandidateStatus,
	type ContentCandidateCreatedPayload,
	type ContentCandidateStatusChangedPayload,
	type ContentCandidateUpdatedPayload,
	createWsMessage,
	type ErrorPayload,
	type EventPayload,
	getRoomKey,
	type JobCompletedPayload,
	type JobCreatedPayload,
	type JobFailedPayload,
	type JobProgressPayload,
	type JobStartedPayload,
	type JobType,
	type JoinRoomPayload,
	type LeaveRoomPayload,
	type ProjectUpdatedPayload,
	parseRoomKey,
	type RoomIdentifier,
	type RoomsJoinedPayload,
	type RoomsLeftPayload,
	RoomType,
	type SourceCreatedPayload,
	type SourceParsedPayload,
	type SourceUpdatedPayload,
	type WorkspaceUpdatedPayload,
	WS_EVENTS,
	type WsEventType,
	type WsMessage,
} from "./events";

// Hooks
export {
	type UseRealtimeUpdatesOptions,
	type UseRoomSubscriptionOptions,
	type UseWebSocketEventOptions,
	type UseWebSocketReturn,
	useRealtimeUpdates,
	useRoomSubscription,
	useWebSocket,
	useWebSocketEvent,
} from "./hooks";
