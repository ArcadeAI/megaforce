/**
 * WebSocket Event Types and Constants
 * Type-safe event definitions for real-time updates
 */

export type JobType =
	| "SOURCE_INGESTION"
	| "PLAN_GENERATION"
	| "CRITIC_REVIEW"
	| "OUTLINE_GENERATION"
	| "CONTENT_GENERATION";

// ============================================================================
// EVENT TYPE CONSTANTS
// ============================================================================

export const WS_EVENTS = {
	// Connection events
	CONNECTION: "connection",
	DISCONNECT: "disconnect",
	ERROR: "error",
	AUTH: "auth",
	AUTHENTICATED: "authenticated",
	PING: "ping",
	PONG: "pong",

	// Room events
	JOIN_ROOM: "join_room",
	LEAVE_ROOM: "leave_room",
	ROOMS_JOINED: "rooms_joined",
	ROOMS_LEFT: "rooms_left",

	// Session events
	SESSION_STAGE_CHANGED: "session:stage_changed",

	// Plan events
	PLAN_GENERATED: "plan:generated",
	PLAN_CRITIC_STARTED: "plan:critic_started",
	PLAN_CRITIC_COMPLETE: "plan:critic_complete",

	// Outline events
	OUTLINE_GENERATED: "outline:generated",
	OUTLINE_CRITIC_STARTED: "outline:critic_started",
	OUTLINE_CRITIC_COMPLETE: "outline:critic_complete",

	// Content generation events
	CONTENT_GENERATION_PROGRESS: "content:generation_progress",
	CONTENT_GENERATION_COMPLETE: "content:generation_complete",
	CONTENT_CRITIC_STARTED: "content:critic_started",
	CONTENT_CRITIC_COMPLETE: "content:critic_complete",

	// Job events
	JOB_CREATED: "job:created",
	JOB_STARTED: "job:started",
	JOB_PROGRESS: "job:progress",
	JOB_COMPLETED: "job:completed",
	JOB_FAILED: "job:failed",

	// Source events
	SOURCE_CREATED: "source:created",
	SOURCE_UPDATED: "source:updated",
	SOURCE_PARSED: "source:parsed",

	// Workspace events
	WORKSPACE_UPDATED: "workspace:updated",
} as const;

export type WsEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// ============================================================================
// ROOM TYPES
// ============================================================================

export enum RoomType {
	USER = "user",
	WORKSPACE = "workspace",
	SESSION = "session",
}

export interface RoomIdentifier {
	type: RoomType;
	id: string;
}

// ============================================================================
// EVENT PAYLOAD TYPES
// ============================================================================

// Connection events
export interface AuthPayload {
	token: string;
}

export interface JoinRoomPayload {
	rooms: RoomIdentifier[];
}

export interface LeaveRoomPayload {
	rooms: RoomIdentifier[];
}

// Session events
export interface SessionStageChangedPayload {
	sessionId: string;
	workspaceId: string;
	previousStage: string;
	currentStage: string;
	updatedAt: string;
}

// Plan events
export interface PlanGeneratedPayload {
	sessionId: string;
	planId: string;
	version: number;
	status: string;
	createdAt: string;
}

export interface PlanCriticStartedPayload {
	sessionId: string;
	planId: string;
	iteration: number;
}

export interface PlanCriticCompletePayload {
	sessionId: string;
	planId: string;
	approved: boolean;
	iteration: number;
	status: string;
}

// Outline events
export interface OutlineGeneratedPayload {
	sessionId: string;
	outlineId: string;
	version: number;
	status: string;
	createdAt: string;
}

export interface OutlineCriticStartedPayload {
	sessionId: string;
	outlineId: string;
	iteration: number;
}

export interface OutlineCriticCompletePayload {
	sessionId: string;
	outlineId: string;
	approved: boolean;
	iteration: number;
	status: string;
}

// Content generation events
export interface ContentGenerationProgressPayload {
	sessionId: string;
	contentId: string;
	sectionIndex: number;
	totalSections: number;
	sectionTitle: string;
	progress: number; // 0-100
}

export interface ContentGenerationCompletePayload {
	sessionId: string;
	contentId: string;
	version: number;
	status: string;
	createdAt: string;
}

export interface ContentCriticStartedPayload {
	sessionId: string;
	contentId: string;
	iteration: number;
}

export interface ContentCriticCompletePayload {
	sessionId: string;
	contentId: string;
	approved: boolean;
	iteration: number;
	status: string;
}

// Job events
export interface JobCreatedPayload {
	jobId: string;
	workspaceId: string;
	jobType: JobType;
	createdAt: string;
}

export interface JobStartedPayload {
	jobId: string;
	workspaceId: string;
	jobType: JobType;
	startedAt: string;
}

export interface JobProgressPayload {
	jobId: string;
	workspaceId: string;
	jobType: JobType;
	progress: number; // 0-100
	message?: string;
}

export interface JobCompletedPayload {
	jobId: string;
	workspaceId: string;
	jobType: JobType;
	result?: Record<string, unknown>;
	completedAt: string;
}

export interface JobFailedPayload {
	jobId: string;
	workspaceId: string;
	jobType: JobType;
	error: string;
	attempts: number;
	failedAt: string;
}

// Source events
export interface SourceCreatedPayload {
	sourceId: string;
	workspaceId: string;
	type: string;
	title: string;
	createdAt: string;
}

export interface SourceUpdatedPayload {
	sourceId: string;
	workspaceId: string;
	title?: string;
	status?: string;
	updatedAt: string;
}

export interface SourceParsedPayload {
	sourceId: string;
	workspaceId: string;
	contentLength: number;
	metadata?: Record<string, unknown>;
	parsedAt: string;
}

// Workspace events
export interface WorkspaceUpdatedPayload {
	workspaceId: string;
	name?: string;
	updatedAt: string;
}

// ============================================================================
// EVENT MESSAGE TYPE
// ============================================================================

export type EventPayload =
	| AuthPayload
	| JoinRoomPayload
	| LeaveRoomPayload
	| SessionStageChangedPayload
	| PlanGeneratedPayload
	| PlanCriticStartedPayload
	| PlanCriticCompletePayload
	| OutlineGeneratedPayload
	| OutlineCriticStartedPayload
	| OutlineCriticCompletePayload
	| ContentGenerationProgressPayload
	| ContentGenerationCompletePayload
	| ContentCriticStartedPayload
	| ContentCriticCompletePayload
	| JobCreatedPayload
	| JobStartedPayload
	| JobProgressPayload
	| JobCompletedPayload
	| JobFailedPayload
	| SourceCreatedPayload
	| SourceUpdatedPayload
	| SourceParsedPayload
	| WorkspaceUpdatedPayload;

export interface WsMessage<T = EventPayload> {
	event: WsEventType;
	payload: T;
	timestamp?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createWsMessage<T = EventPayload>(
	event: WsEventType,
	payload: T,
): WsMessage<T> {
	return {
		event,
		payload,
		timestamp: new Date().toISOString(),
	};
}

export function getRoomKey(room: RoomIdentifier): string {
	return `${room.type}:${room.id}`;
}

export function parseRoomKey(roomKey: string): RoomIdentifier | null {
	const [type, id] = roomKey.split(":");
	if (!type || !id || !Object.values(RoomType).includes(type as RoomType)) {
		return null;
	}
	return {
		type: type as RoomType,
		id,
	};
}
