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

// Handle Redis connection errors
connection.on("error", (error: Error) => {
	console.error("Redis connection error:", error);
});

connection.on("connect", () => {
	console.log("Redis connected successfully");
});

// Queue names
export enum QueueName {
	SOURCE_INGESTION = "source-ingestion",
	STYLE_LEARNING = "style-learning",
	CONTENT_GENERATION = "content-generation",
	PUBLISHING = "publishing",
	ANALYTICS = "analytics",
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
	url: string;
}

export interface StyleLearningJobData {
	userId: string;
	sourceIds: string[];
}

export interface ContentGenerationJobData {
	userId: string;
	topic: string;
	styleProfile: string;
}

export interface PublishingJobData {
	contentId: string;
	platforms: string[];
	scheduledTime?: Date;
}

export interface AnalyticsJobData {
	contentId: string;
	platform: string;
	metricsType: string;
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

export const styleLearningQueue = new Queue<StyleLearningJobData>(
	QueueName.STYLE_LEARNING,
	createQueueConfig(QueuePriority.NORMAL),
);

export const contentGenerationQueue = new Queue<ContentGenerationJobData>(
	QueueName.CONTENT_GENERATION,
	createQueueConfig(QueuePriority.HIGH),
);

export const publishingQueue = new Queue<PublishingJobData>(
	QueueName.PUBLISHING,
	createQueueConfig(QueuePriority.CRITICAL),
);

export const analyticsQueue = new Queue<AnalyticsJobData>(
	QueueName.ANALYTICS,
	createQueueConfig(QueuePriority.LOW),
);

// Export all queues as a map for easy access
export const queues = {
	[QueueName.SOURCE_INGESTION]: sourceIngestionQueue,
	[QueueName.STYLE_LEARNING]: styleLearningQueue,
	[QueueName.CONTENT_GENERATION]: contentGenerationQueue,
	[QueueName.PUBLISHING]: publishingQueue,
	[QueueName.ANALYTICS]: analyticsQueue,
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
