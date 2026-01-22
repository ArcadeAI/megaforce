import { type Job, Worker } from "bullmq";
import { connection, type PublishingJobData, QueueName } from "../queue";

// Job processor
async function processPublishing(job: Job<PublishingJobData>): Promise<void> {
	const { contentId, platforms, scheduledTime } = job.data;

	console.log(`Processing publishing job ${job.id}`, {
		contentId,
		platforms,
		scheduledTime,
	});

	// TODO: Implement publishing logic
	// This will be implemented in a later phase

	await job.updateProgress(100);
}

// Worker instance
export const publishingWorker = new Worker<PublishingJobData>(
	QueueName.PUBLISHING,
	processPublishing,
	{
		connection,
		concurrency: 10,
		limiter: {
			max: 20,
			duration: 1000,
		},
	},
);

// Event handlers
publishingWorker.on("completed", (job: Job<PublishingJobData>) => {
	console.log(`Publishing job ${job.id} completed successfully`);
});

publishingWorker.on(
	"failed",
	(job: Job<PublishingJobData> | undefined, error: Error) => {
		console.error(`Publishing job ${job?.id} failed:`, error);
	},
);

publishingWorker.on("error", (error: Error) => {
	console.error("Publishing worker error:", error);
});
