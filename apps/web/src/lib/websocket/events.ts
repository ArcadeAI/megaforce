/**
 * WebSocket Event Types and Constants
 * Type-safe event definitions for real-time updates
 * Mirrors backend event types from apps/server/src/websocket/events.ts
 */

// Re-export types from Prisma client enums
export type CandidateStatus =
	| "GENERATING"
	| "PENDING"
	| "APPROVED"
	| "SCHEDULED"
	| "REJECTED"
	| "PUBLISHED"
	| "FAILED";

export type JobType =
	| "SOURCE_INGESTION"
	| "STYLE_LEARNING"
	| "CONTENT_GENERATION"
	| "CONTENT_PUBLISHING"
	| "ANALYTICS_FETCH";

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

	// Content events
	CONTENT_CANDIDATE_CREATED: "content_candidate:created",
	CONTENT_CANDIDATE_UPDATED: "content_candidate:updated",
	CONTENT_CANDIDATE_STATUS_CHANGED: "content_candidate:status_changed",

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

	// Project events
	PROJECT_UPDATED: "project:updated",

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
	PROJECT = "project",
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

export interface AuthenticatedPayload {
	userId: string;
	workspaceId: string;
}

export interface JoinRoomPayload {
	rooms: RoomIdentifier[];
}

export interface LeaveRoomPayload {
	rooms: RoomIdentifier[];
}

export interface RoomsJoinedPayload {
	rooms: string[]; // Array of room keys like "user:123", "workspace:456"
}

export interface RoomsLeftPayload {
	rooms: string[]; // Array of room keys
}

// Content candidate events
export interface ContentCandidateCreatedPayload {
	candidateId: string;
	workspaceId: string;
	projectId: string;
	personaId: string;
	outputConfigId: string;
	status: CandidateStatus;
	content: string;
	createdAt: string;
}

export interface ContentCandidateUpdatedPayload {
	candidateId: string;
	workspaceId: string;
	projectId: string;
	content: string;
	editDiff?: Record<string, unknown>;
	updatedAt: string;
}

export interface ContentCandidateStatusChangedPayload {
	candidateId: string;
	workspaceId: string;
	projectId: string;
	oldStatus: CandidateStatus;
	newStatus: CandidateStatus;
	rejectionReason?: string;
	updatedAt: string;
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

// Project events
export interface ProjectUpdatedPayload {
	projectId: string;
	workspaceId: string;
	name?: string;
	description?: string;
	updatedAt: string;
}

// Workspace events
export interface WorkspaceUpdatedPayload {
	workspaceId: string;
	name?: string;
	updatedAt: string;
}

// Error payload
export interface ErrorPayload {
	message: string;
	code?: string;
}

// ============================================================================
// EVENT MESSAGE TYPE
// ============================================================================

export type EventPayload =
	| AuthPayload
	| AuthenticatedPayload
	| JoinRoomPayload
	| LeaveRoomPayload
	| RoomsJoinedPayload
	| RoomsLeftPayload
	| ContentCandidateCreatedPayload
	| ContentCandidateUpdatedPayload
	| ContentCandidateStatusChangedPayload
	| JobCreatedPayload
	| JobStartedPayload
	| JobProgressPayload
	| JobCompletedPayload
	| JobFailedPayload
	| SourceCreatedPayload
	| SourceUpdatedPayload
	| SourceParsedPayload
	| ProjectUpdatedPayload
	| WorkspaceUpdatedPayload
	| ErrorPayload;

export interface WsMessage<T = EventPayload> {
	event: WsEventType;
	payload: T;
	timestamp?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a WebSocket message
 */
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

/**
 * Create a room identifier string for internal use
 */
export function getRoomKey(room: RoomIdentifier): string {
	return `${room.type}:${room.id}`;
}

/**
 * Parse a room identifier string back to RoomIdentifier
 */
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
