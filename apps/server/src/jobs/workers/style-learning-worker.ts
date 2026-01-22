import { type Job, Worker } from "bullmq";
import { connection, QueueName, type StyleLearningJobData } from "../queue";

// Job processor
async function processStyleLearning(
	job: Job<StyleLearningJobData>,
): Promise<void> {
	const { userId, sourceIds } = job.data;

	console.log(`Processing style learning job ${job.id}`, {
		userId,
		sourceCount: sourceIds.length,
	});

	// TODO: Implement style learning logic
	// This will be implemented in a later phase

	await job.updateProgress(100);
}

// Worker instance
export const styleLearningWorker = new Worker<StyleLearningJobData>(
	QueueName.STYLE_LEARNING,
	processStyleLearning,
	{
		connection,
		concurrency: 3,
		limiter: {
			max: 5,
			duration: 1000,
		},
	},
);

// Event handlers
styleLearningWorker.on("completed", (job: Job<StyleLearningJobData>) => {
	console.log(`Style learning job ${job.id} completed successfully`);
});

styleLearningWorker.on(
	"failed",
	(job: Job<StyleLearningJobData> | undefined, error: Error) => {
		console.error(`Style learning job ${job?.id} failed:`, error);
	},
);

styleLearningWorker.on("error", (error: Error) => {
	console.error("Style learning worker error:", error);
});
