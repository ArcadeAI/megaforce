import { type Job, Worker } from "bullmq";
import { connection, QueueName, type SourceIngestionJobData } from "../queue";

// Job processor
async function processSourceIngestion(
	job: Job<SourceIngestionJobData>,
): Promise<void> {
	const { sourceId, url } = job.data;

	console.log(`Processing source ingestion job ${job.id}`, {
		sourceId,
		url,
	});

	// TODO: Implement source ingestion logic
	// This will be implemented in a later phase

	await job.updateProgress(100);
}

// Worker instance
export const sourceIngestionWorker = new Worker<SourceIngestionJobData>(
	QueueName.SOURCE_INGESTION,
	processSourceIngestion,
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
sourceIngestionWorker.on("completed", (job: Job<SourceIngestionJobData>) => {
	console.log(`Source ingestion job ${job.id} completed successfully`);
});

sourceIngestionWorker.on(
	"failed",
	(job: Job<SourceIngestionJobData> | undefined, error: Error) => {
		console.error(`Source ingestion job ${job?.id} failed:`, error);
	},
);

sourceIngestionWorker.on("error", (error: Error) => {
	console.error("Source ingestion worker error:", error);
});
