import { env } from "@megaforce/env/server";
import { Queue, type QueueOptions } from "bullmq";
import { Redis } from "ioredis";

// Redis connection configuration
export const connection = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
	retryStrategy(times: number) {
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
});

connection.on("error", (error: Error) => {
	console.error("Redis connection error:", error);
});

connection.on("connect", () => {
	console.log("Redis connected successfully");
});

// Queue names
export enum QueueName {
	SOURCE_INGESTION = "source-ingestion",
	PLAN_GENERATION = "plan-generation",
	CRITIC_REVIEW = "critic-review",
	OUTLINE_GENERATION = "outline-generation",
	CONTENT_GENERATION = "content-generation",
}

// Queue priority levels
export enum QueuePriority {
	CRITICAL = 1,
	HIGH = 2,
	NORMAL = 3,
	LOW = 4,
}

// Type-safe job data definitions
export interface SourceIngestionJobData {
	sourceId: string;
	sessionId?: string;
}

export interface PlanGenerationJobData {
	sessionId: string;
	planId?: string;
}

export interface CriticReviewJobData {
	sessionId: string;
	artifactType: "plan" | "outline" | "content";
	artifactId: string;
}

export interface OutlineGenerationJobData {
	sessionId: string;
	planId: string;
	outlineId?: string;
}

export interface ContentGenerationJobData {
	sessionId: string;
	outlineId: string;
	contentId?: string;
}

// Queue configuration factory
function createQueueConfig(priority: QueuePriority): QueueOptions {
	return {
		connection,
		defaultJobOptions: {
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 1000,
			},
			removeOnComplete: {
				age: 24 * 3600, // 24 hours
				count: 1000,
			},
			removeOnFail: {
				age: 7 * 24 * 3600, // 7 days
			},
			priority,
		},
	};
}

// Queue instances
export const sourceIngestionQueue = new Queue<SourceIngestionJobData>(
	QueueName.SOURCE_INGESTION,
	createQueueConfig(QueuePriority.NORMAL),
);

export const planGenerationQueue = new Queue<PlanGenerationJobData>(
	QueueName.PLAN_GENERATION,
	createQueueConfig(QueuePriority.HIGH),
);

export const criticReviewQueue = new Queue<CriticReviewJobData>(
	QueueName.CRITIC_REVIEW,
	createQueueConfig(QueuePriority.HIGH),
);

export const outlineGenerationQueue = new Queue<OutlineGenerationJobData>(
	QueueName.OUTLINE_GENERATION,
	createQueueConfig(QueuePriority.HIGH),
);

export const contentGenerationQueue = new Queue<ContentGenerationJobData>(
	QueueName.CONTENT_GENERATION,
	createQueueConfig(QueuePriority.HIGH),
);

// Export all queues as a map for easy access
export const queues = {
	[QueueName.SOURCE_INGESTION]: sourceIngestionQueue,
	[QueueName.PLAN_GENERATION]: planGenerationQueue,
	[QueueName.CRITIC_REVIEW]: criticReviewQueue,
	[QueueName.OUTLINE_GENERATION]: outlineGenerationQueue,
	[QueueName.CONTENT_GENERATION]: contentGenerationQueue,
} as const;

// Graceful shutdown handler
export async function closeQueues(): Promise<void> {
	try {
		await Promise.all(Object.values(queues).map((queue) => queue.close()));
		await connection.quit();
		console.log("All queues and Redis connection closed successfully");
	} catch (error) {
		console.error("Error closing queues:", error);
		throw error;
	}
}
