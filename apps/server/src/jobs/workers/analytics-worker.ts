import { type Job, Worker } from "bullmq";
import { type AnalyticsJobData, connection, QueueName } from "../queue";

// Job processor
async function processAnalytics(job: Job<AnalyticsJobData>): Promise<void> {
	const { contentId, platform, metricsType } = job.data;

	console.log(`Processing analytics job ${job.id}`, {
		contentId,
		platform,
		metricsType,
	});

	// TODO: Implement analytics logic
	// This will be implemented in a later phase

	await job.updateProgress(100);
}

// Worker instance
export const analyticsWorker = new Worker<AnalyticsJobData>(
	QueueName.ANALYTICS,
	processAnalytics,
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
analyticsWorker.on("completed", (job: Job<AnalyticsJobData>) => {
	console.log(`Analytics job ${job.id} completed successfully`);
});

analyticsWorker.on(
	"failed",
	(job: Job<AnalyticsJobData> | undefined, error: Error) => {
		console.error(`Analytics job ${job?.id} failed:`, error);
	},
);

analyticsWorker.on("error", (error: Error) => {
	console.error("Analytics worker error:", error);
});
