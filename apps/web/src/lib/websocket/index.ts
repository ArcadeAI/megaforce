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
	type ContentCriticCompletePayload,
	type ContentCriticStartedPayload,
	type ContentGenerationCompletePayload,
	type ContentGenerationProgressPayload,
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
	type OutlineCriticCompletePayload,
	type OutlineCriticStartedPayload,
	type OutlineGeneratedPayload,
	type PlanCriticCompletePayload,
	type PlanCriticStartedPayload,
	type PlanGeneratedPayload,
	parseRoomKey,
	type RoomIdentifier,
	type RoomsJoinedPayload,
	type RoomsLeftPayload,
	RoomType,
	type SessionStageChangedPayload,
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
