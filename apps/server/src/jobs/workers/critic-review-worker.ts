import prisma from "@megaforce/db";
import { type Job, Worker } from "bullmq";
import {
	type ChatMessage,
	chatCompletion,
	chatCompletionJSON,
} from "../../lib/llm";
import {
	type EventPayload,
	RoomType,
	WS_EVENTS,
	type WsEventType,
} from "../../websocket/events";
import { getWsServer } from "../../websocket/server";
import { type CriticReviewJobData, connection, QueueName } from "../queue";

const MAX_CRITIC_ITERATIONS = 5;

interface CriticFeedback {
	approved: boolean;
	score: number; // 1-10
	objections: string[];
	suggestions: string[];
	summary: string;
}

function broadcastSafe(
	event: WsEventType,
	payload: Record<string, unknown>,
	sessionId: string,
): void {
	try {
		const wsServer = getWsServer();
		wsServer.broadcastToRoom(
			{ type: RoomType.SESSION, id: sessionId },
			{
				event,
				payload: payload as unknown as EventPayload,
				timestamp: new Date().toISOString(),
			},
		);
	} catch {
		// WS server may not be initialized
	}
}

async function getCriticFeedback(
	artifactType: string,
	content: unknown,
	sessionContext: string,
): Promise<CriticFeedback> {
	const systemPrompt = `You are a rigorous content critic. Evaluate the provided ${artifactType} and determine if it meets quality standards.

You MUST respond with valid JSON:
{
  "approved": true/false,
  "score": 1-10,
  "objections": ["list of specific issues that must be fixed"],
  "suggestions": ["list of improvements that would enhance quality"],
  "summary": "Brief overall assessment"
}

Approve (score >= 7) if the ${artifactType} is:
- Well-structured and logically organized
- Comprehensive and addresses the requirements
- Clear and actionable
- Appropriate for the target audience

Reject (score < 7) if there are significant gaps, unclear sections, or structural problems.`;

	const contentStr =
		typeof content === "string" ? content : JSON.stringify(content, null, 2);

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt },
		{
			role: "user",
			content: `Session context:\n${sessionContext}\n\n${artifactType.toUpperCase()} to review:\n${contentStr}`,
		},
	];

	return chatCompletionJSON<CriticFeedback>(messages, {
		temperature: 0.3,
		maxTokens: 2048,
	});
}

async function reviseArtifact(
	artifactType: string,
	currentContent: unknown,
	feedback: CriticFeedback,
	sessionContext: string,
): Promise<unknown> {
	const contentStr =
		typeof currentContent === "string"
			? currentContent
			: JSON.stringify(currentContent, null, 2);

	const systemPrompt = `You are a content revision AI. Revise the provided ${artifactType} based on critic feedback.
${artifactType === "content" ? "Respond with the revised content as plain text." : "Respond with valid JSON matching the same structure as the input."}`;

	const userPrompt = `Session context:\n${sessionContext}

Current ${artifactType}:
${contentStr}

Critic feedback:
- Score: ${feedback.score}/10
- Objections: ${feedback.objections.join("; ")}
- Suggestions: ${feedback.suggestions.join("; ")}

Please revise the ${artifactType} to address the objections and incorporate the suggestions.`;

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userPrompt },
	];

	if (artifactType === "content") {
		return chatCompletion(messages, { temperature: 0.5, maxTokens: 8192 });
	}
	return chatCompletionJSON(messages, { temperature: 0.5, maxTokens: 4096 });
}

async function getSessionContext(sessionId: string): Promise<string> {
	const session = await prisma.contentSession.findUnique({
		where: { id: sessionId },
		include: {
			sessionPersonas: { include: { persona: true } },
		},
	});
	if (!session) return "";

	const outputTypes = (session.outputTypes as string[]) ?? [];
	const clarifying =
		(session.clarifyingAnswers as Record<string, string>) ?? {};
	const persona = session.sessionPersonas[0]?.persona;

	let context = `Output types: ${outputTypes.join(", ") || "General"}`;
	context += `\nTone: ${clarifying.tone || "Professional"}`;
	context += `\nAudience: ${clarifying.audience || "General"}`;
	if (clarifying.keywords) context += `\nKeywords: ${clarifying.keywords}`;
	if (persona) context += `\nPersona: ${persona.name}`;
	return context;
}

async function getExistingFeedback(
	artifactType: string,
	artifactId: string,
): Promise<unknown[]> {
	let feedback: unknown = null;
	if (artifactType === "plan") {
		const plan = await prisma.plan.findUnique({ where: { id: artifactId } });
		feedback = plan?.criticFeedback;
	} else if (artifactType === "outline") {
		const outline = await prisma.outline.findUnique({
			where: { id: artifactId },
		});
		feedback = outline?.criticFeedback;
	} else {
		const content = await prisma.generatedContent.findUnique({
			where: { id: artifactId },
		});
		feedback = content?.criticFeedback;
	}
	return Array.isArray(feedback) ? feedback : [];
}

async function processCriticReview(
	job: Job<CriticReviewJobData>,
): Promise<void> {
	const { sessionId, artifactType, artifactId } = job.data;

	console.log(`Processing critic review job ${job.id}`, {
		sessionId,
		artifactType,
		artifactId,
	});

	const sessionContext = await getSessionContext(sessionId);

	// Determine the critic started/complete event names
	const eventMap = {
		plan: {
			started: WS_EVENTS.PLAN_CRITIC_STARTED,
			complete: WS_EVENTS.PLAN_CRITIC_COMPLETE,
			idField: "planId",
		},
		outline: {
			started: WS_EVENTS.OUTLINE_CRITIC_STARTED,
			complete: WS_EVENTS.OUTLINE_CRITIC_COMPLETE,
			idField: "outlineId",
		},
		content: {
			started: WS_EVENTS.CONTENT_CRITIC_STARTED,
			complete: WS_EVENTS.CONTENT_CRITIC_COMPLETE,
			idField: "contentId",
		},
	} as const;

	const events = eventMap[artifactType];

	for (let iteration = 1; iteration <= MAX_CRITIC_ITERATIONS; iteration++) {
		// Broadcast critic started
		broadcastSafe(
			events.started,
			{ sessionId, [events.idField]: artifactId, iteration },
			sessionId,
		);

		await job.updateProgress(
			Math.round((iteration / MAX_CRITIC_ITERATIONS) * 80),
		);

		// Fetch current artifact content
		let currentContent: unknown;
		if (artifactType === "plan") {
			const plan = await prisma.plan.findUnique({
				where: { id: artifactId },
			});
			if (!plan) throw new Error(`Plan ${artifactId} not found`);
			currentContent = plan.content;
		} else if (artifactType === "outline") {
			const outline = await prisma.outline.findUnique({
				where: { id: artifactId },
			});
			if (!outline) throw new Error(`Outline ${artifactId} not found`);
			currentContent = outline.content;
		} else {
			const content = await prisma.generatedContent.findUnique({
				where: { id: artifactId },
			});
			if (!content) throw new Error(`Content ${artifactId} not found`);
			currentContent = content.content;
		}

		// Get critic feedback
		const feedback = await getCriticFeedback(
			artifactType,
			currentContent,
			sessionContext,
		);

		const feedbackEntry = {
			iteration,
			...feedback,
			timestamp: new Date().toISOString(),
		};

		if (feedback.approved || iteration === MAX_CRITIC_ITERATIONS) {
			// Approved or max iterations reached — mark as CRITIC_APPROVED
			const finalStatus = feedback.approved
				? "CRITIC_APPROVED"
				: "CRITIC_APPROVED"; // Accept even if max iterations reached

			if (artifactType === "plan") {
				await prisma.plan.update({
					where: { id: artifactId },
					data: {
						status: finalStatus,
						criticIterations: iteration,
						criticFeedback: [
							...(await getExistingFeedback(artifactType, artifactId)),
							feedbackEntry,
						] as object[],
					},
				});
			} else if (artifactType === "outline") {
				await prisma.outline.update({
					where: { id: artifactId },
					data: {
						status: finalStatus,
						criticIterations: iteration,
						criticFeedback: [
							...(await getExistingFeedback(artifactType, artifactId)),
							feedbackEntry,
						] as object[],
					},
				});
			} else {
				await prisma.generatedContent.update({
					where: { id: artifactId },
					data: {
						status: finalStatus,
						criticIterations: iteration,
						criticFeedback: [
							...(await getExistingFeedback(artifactType, artifactId)),
							feedbackEntry,
						] as object[],
					},
				});
			}

			// Broadcast critic complete
			broadcastSafe(
				events.complete,
				{
					sessionId,
					[events.idField]: artifactId,
					approved: feedback.approved,
					iteration,
					status: finalStatus,
				},
				sessionId,
			);

			console.log(
				`Critic ${feedback.approved ? "approved" : "max iterations reached"} for ${artifactType} ${artifactId} at iteration ${iteration}`,
			);
			break;
		}

		// Not approved — revise the artifact
		console.log(
			`Critic rejected ${artifactType} ${artifactId} at iteration ${iteration}, revising...`,
		);

		const revisedContent = await reviseArtifact(
			artifactType,
			currentContent,
			feedback,
			sessionContext,
		);

		// Update the artifact with revised content
		if (artifactType === "plan") {
			await prisma.plan.update({
				where: { id: artifactId },
				data: {
					content: revisedContent as object,
					status: "CRITIC_REVIEWING",
					criticIterations: iteration,
					criticFeedback: [
						...(await getExistingFeedback(artifactType, artifactId)),
						feedbackEntry,
					] as object[],
				},
			});
		} else if (artifactType === "outline") {
			await prisma.outline.update({
				where: { id: artifactId },
				data: {
					content: revisedContent as object,
					status: "CRITIC_REVIEWING",
					criticIterations: iteration,
					criticFeedback: [
						...(await getExistingFeedback(artifactType, artifactId)),
						feedbackEntry,
					] as object[],
				},
			});
		} else {
			await prisma.generatedContent.update({
				where: { id: artifactId },
				data: {
					content: revisedContent as string,
					status: "CRITIC_REVIEWING",
					criticIterations: iteration,
					criticFeedback: [
						...(await getExistingFeedback(artifactType, artifactId)),
						feedbackEntry,
					] as object[],
				},
			});
		}
	}

	await job.updateProgress(100);
}

export const criticReviewWorker = new Worker<CriticReviewJobData>(
	QueueName.CRITIC_REVIEW,
	processCriticReview,
	{
		connection,
		concurrency: 3,
		limiter: { max: 5, duration: 1000 },
	},
);

criticReviewWorker.on("completed", (job: Job<CriticReviewJobData>) => {
	console.log(`Critic review job ${job.id} completed`);
});

criticReviewWorker.on(
	"failed",
	(job: Job<CriticReviewJobData> | undefined, error: Error) => {
		console.error(`Critic review job ${job?.id} failed:`, error);
	},
);

criticReviewWorker.on("error", (error: Error) => {
	console.error("Critic review worker error:", error);
});
