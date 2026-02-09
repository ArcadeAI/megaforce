import prisma from "@megaforce/db";
import { type Job, Worker } from "bullmq";

import { connection, QueueName, type SourceIngestionJobData } from "../queue";

/**
 * Strip HTML content down to plain text.
 * Removes <script> and <style> blocks entirely, then strips remaining tags,
 * decodes common HTML entities, and collapses whitespace.
 */
function stripHtml(html: string): string {
	let text = html;

	// Remove <script> tags and their content
	text = text.replaceAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

	// Remove <style> tags and their content
	text = text.replaceAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

	// Remove all remaining HTML tags
	text = text.replaceAll(/<[^>]+>/g, " ");

	// Decode common HTML entities
	text = text
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'")
		.replaceAll("&nbsp;", " ");

	// Collapse whitespace (newlines, tabs, multiple spaces) into single spaces
	text = text.replaceAll(/\s+/g, " ").trim();

	return text;
}

/**
 * Count words by splitting on whitespace, filtering out empty strings.
 */
function countWords(text: string): number {
	if (!text) {
		return 0;
	}
	return text.split(/\s+/).filter(Boolean).length;
}

async function processSourceIngestion(
	job: Job<SourceIngestionJobData>,
): Promise<void> {
	const { sourceId, sessionId } = job.data;

	console.log(`Processing source ingestion job ${job.id}`, {
		sourceId,
		sessionId,
	});

	// Fetch the source from the database
	const source = await prisma.source.findUnique({
		where: { id: sourceId },
	});

	if (!source) {
		throw new Error(`Source ${sourceId} not found`);
	}

	await job.updateProgress(10);

	// Mark source as parsing
	await prisma.source.update({
		where: { id: sourceId },
		data: { status: "parsing" },
	});

	await job.updateProgress(20);

	let parsedContent: string | null = null;
	let wordCount: number | null = null;

	try {
		if (source.type === "URL" && source.url) {
			// Fetch the URL content
			const response = await fetch(source.url, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (compatible; Megaforce/1.0; +https://megaforce.app)",
					Accept: "text/html, application/xhtml+xml, text/plain, */*",
				},
				redirect: "follow",
				signal: AbortSignal.timeout(30_000),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch URL ${source.url}: ${response.status} ${response.statusText}`,
				);
			}

			await job.updateProgress(50);

			const html = await response.text();

			await job.updateProgress(70);

			// Extract text content by stripping HTML
			parsedContent = stripHtml(html);
			wordCount = countWords(parsedContent);
		} else if (source.type === "TEXT" && source.content) {
			// Text sources already have their content — just pass through
			parsedContent = source.content;
			wordCount = countWords(parsedContent);

			await job.updateProgress(70);
		} else {
			// Unsupported type or missing data — mark as parsed with no content
			console.warn(
				`Source ${sourceId} has type "${source.type}" with no processable content`,
			);
			await job.updateProgress(70);
		}

		// Update the source with parsed content and word count
		await prisma.source.update({
			where: { id: sourceId },
			data: {
				parsedContent,
				wordCount,
				status: "parsed",
			},
		});

		await job.updateProgress(100);

		console.log(
			`Source ingestion completed for source ${sourceId} (${source.type}): ${wordCount ?? 0} words`,
		);
	} catch (error) {
		// Mark source as failed before re-throwing
		await prisma.source.update({
			where: { id: sourceId },
			data: { status: "failed" },
		});

		throw error;
	}
}

export const sourceIngestionWorker = new Worker<SourceIngestionJobData>(
	QueueName.SOURCE_INGESTION,
	processSourceIngestion,
	{
		connection,
		concurrency: 5,
		limiter: { max: 10, duration: 1000 },
	},
);

sourceIngestionWorker.on("completed", (job: Job<SourceIngestionJobData>) => {
	console.log(`Source ingestion job ${job.id} completed`);
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
