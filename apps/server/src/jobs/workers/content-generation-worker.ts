import { type Job, Worker } from "bullmq";
import { type ContentGenerationJobData, connection, QueueName } from "../queue";

// Job processor
async function processContentGeneration(
	job: Job<ContentGenerationJobData>,
): Promise<void> {
	const { userId, topic, styleProfile } = job.data;

	console.log(`Processing content generation job ${job.id}`, {
		userId,
		topic,
		styleProfile,
	});

	// TODO: Implement content generation logic
	// This will be implemented in a later phase

	await job.updateProgress(100);
}

// Worker instance
export const contentGenerationWorker = new Worker<ContentGenerationJobData>(
	QueueName.CONTENT_GENERATION,
	processContentGeneration,
	{
		connection,
		concurrency: 5,
		limiter: {
			max: 10,
			duration: 1000,
		},
	},
);

// Event handlers
contentGenerationWorker.on(
	"completed",
	(job: Job<ContentGenerationJobData>) => {
		console.log(`Content generation job ${job.id} completed successfully`);
	},
);

contentGenerationWorker.on(
	"failed",
	(job: Job<ContentGenerationJobData> | undefined, error: Error) => {
		console.error(`Content generation job ${job?.id} failed:`, error);
	},
);

contentGenerationWorker.on("error", (error: Error) => {
	console.error("Content generation worker error:", error);
});
