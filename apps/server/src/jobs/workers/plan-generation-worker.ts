import prisma from "@megaforce/db";
import { type Job, Worker } from "bullmq";
import { type ChatMessage, chatCompletionJSON } from "../../lib/llm";
import {
	createWsMessage,
	type PlanGeneratedPayload,
	RoomType,
	WS_EVENTS,
} from "../../websocket/events";
import { getWsServer } from "../../websocket/server";
import {
	connection,
	criticReviewQueue,
	type PlanGenerationJobData,
	QueueName,
} from "../queue";

interface PlanContent {
	executiveSummary: string;
	targetAudience: string;
	keyMessages: string[];
	contentStructure: {
		format: string;
		estimatedLength: string;
		sections: Array<{
			title: string;
			purpose: string;
		}>;
	};
	successCriteria: string[];
	toneAndStyle: string;
}

async function processPlanGeneration(
	job: Job<PlanGenerationJobData>,
): Promise<void> {
	const { sessionId } = job.data;

	console.log(`Processing plan generation job ${job.id}`, { sessionId });

	// Fetch session with all context
	const session = await prisma.contentSession.findUnique({
		where: { id: sessionId },
		include: {
			sessionPersonas: {
				include: { persona: true },
			},
			sessionSources: {
				include: { source: true },
			},
		},
	});

	if (!session) {
		throw new Error(`Session ${sessionId} not found`);
	}

	await job.updateProgress(10);

	// Build the prompt
	const outputTypes = (session.outputTypes as string[]) ?? [];
	const clarifying =
		(session.clarifyingAnswers as Record<string, string>) ?? {};
	const persona = session.sessionPersonas[0]?.persona;
	const sources = session.sessionSources.map((ss) => ss.source);

	const systemPrompt = `You are a content strategist AI. Generate a detailed content plan based on the user's requirements.
You MUST respond with valid JSON matching this structure:
{
  "executiveSummary": "Brief overview of the content plan",
  "targetAudience": "Description of the target audience",
  "keyMessages": ["message1", "message2", ...],
  "contentStructure": {
    "format": "The content format",
    "estimatedLength": "Estimated word count/length",
    "sections": [{"title": "Section name", "purpose": "What this section achieves"}]
  },
  "successCriteria": ["criterion1", "criterion2", ...],
  "toneAndStyle": "Description of the writing tone and style"
}`;

	let userPrompt = `Create a content plan for the following:

**Output Types:** ${outputTypes.join(", ") || "General content"}
**Tone:** ${clarifying.tone || "Professional"}
**Target Audience:** ${clarifying.audience || "General audience"}
**Keywords:** ${clarifying.keywords || "None specified"}`;

	if (clarifying.additionalContext) {
		userPrompt += `\n**Additional Context:** ${clarifying.additionalContext}`;
	}

	if (persona) {
		userPrompt += `\n\n**Writing Persona:** ${persona.name}`;
		if (persona.description) {
			userPrompt += ` - ${persona.description}`;
		}
		const style = persona.styleProfile as Record<string, string> | null;
		if (style) {
			userPrompt += `\nStyle: tone=${style.tone || "professional"}, formality=${style.formality || "moderate"}`;
		}
	}

	if (sources.length > 0) {
		userPrompt += "\n\n**Reference Sources:**";
		for (const source of sources) {
			userPrompt += `\n- ${source.title} (${source.type})`;
			if (source.url) userPrompt += ` - ${source.url}`;
			if (source.parsedContent) {
				userPrompt += `\n  Content preview: ${source.parsedContent.slice(0, 500)}...`;
			}
		}
	}

	await job.updateProgress(30);

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userPrompt },
	];

	// Generate the plan via LLM
	const planContent = await chatCompletionJSON<PlanContent>(messages, {
		temperature: 0.7,
		maxTokens: 4096,
	});

	await job.updateProgress(70);

	// Update existing placeholder or create new plan
	const plan = job.data.planId
		? await prisma.plan.update({
				where: { id: job.data.planId },
				data: { content: planContent as object },
			})
		: await (async () => {
				const latestPlan = await prisma.plan.findFirst({
					where: { sessionId },
					orderBy: { version: "desc" },
				});
				return prisma.plan.create({
					data: {
						sessionId,
						version: (latestPlan?.version ?? 0) + 1,
						content: planContent as object,
						status: "DRAFT",
						criticIterations: 0,
					},
				});
			})();

	await job.updateProgress(80);

	// Broadcast via WebSocket
	try {
		const wsServer = getWsServer();
		wsServer.broadcastToRoom(
			{ type: RoomType.SESSION, id: sessionId },
			createWsMessage<PlanGeneratedPayload>(WS_EVENTS.PLAN_GENERATED, {
				sessionId,
				planId: plan.id,
				version: plan.version,
				status: plan.status,
				createdAt: plan.createdAt.toISOString(),
			}),
		);
	} catch {
		// WS server may not be initialized in test/worker-only contexts
	}

	// Auto-trigger critic review
	await criticReviewQueue.add("critic-review-plan", {
		sessionId,
		artifactType: "plan",
		artifactId: plan.id,
	});

	await job.updateProgress(100);
	console.log(
		`Plan generation completed for session ${sessionId}, plan ${plan.id} v${plan.version}`,
	);
}

export const planGenerationWorker = new Worker<PlanGenerationJobData>(
	QueueName.PLAN_GENERATION,
	processPlanGeneration,
	{
		connection,
		concurrency: 3,
		limiter: { max: 5, duration: 1000 },
	},
);

planGenerationWorker.on("completed", (job: Job<PlanGenerationJobData>) => {
	console.log(`Plan generation job ${job.id} completed`);
});

planGenerationWorker.on(
	"failed",
	(job: Job<PlanGenerationJobData> | undefined, error: Error) => {
		console.error(`Plan generation job ${job?.id} failed:`, error);
	},
);

planGenerationWorker.on("error", (error: Error) => {
	console.error("Plan generation worker error:", error);
});
