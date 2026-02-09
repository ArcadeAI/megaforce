import prisma from "@megaforce/db";
import { type Job, Worker } from "bullmq";

import { chatCompletionJSON, type ChatMessage } from "../../lib/llm";
import {
	createWsMessage,
	type OutlineGeneratedPayload,
	RoomType,
	WS_EVENTS,
} from "../../websocket/events";
import { getWsServer } from "../../websocket/server";
import {
	connection,
	criticReviewQueue,
	type OutlineGenerationJobData,
	QueueName,
} from "../queue";

interface KnowledgeFactsResult {
	facts: {
		fact: string;
		confidence: number;
		relevance: number;
	}[];
}

interface OutlineContent {
	sections: {
		title: string;
		subsections: {
			title: string;
			keyPoints: string[];
			sourceRefs: string[];
		}[];
	}[];
}

async function processOutlineGeneration(
	job: Job<OutlineGenerationJobData>,
): Promise<void> {
	const { sessionId, planId } = job.data;

	console.log(`Processing outline generation job ${job.id}`, {
		sessionId,
		planId,
	});

	// Fetch session with personas and sources
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

	// Fetch the approved plan
	const plan = await prisma.plan.findUnique({
		where: { id: planId },
	});

	if (!plan) {
		throw new Error(`Plan ${planId} not found`);
	}

	await job.updateProgress(10);

	// Build knowledge base entries from sources
	const sources = session.sessionSources.map((ss) => ss.source);
	const sourcesWithContent = sources.filter((s) => s.parsedContent);

	let knowledgeBase = null;
	const knowledgeEntries: { fact: string; sourceRef: string }[] = [];

	if (sourcesWithContent.length > 0) {
		// Create a knowledge base for this session
		knowledgeBase = await prisma.knowledgeBase.create({
			data: {
				sessionId,
			},
		});

		// Extract key facts from each source via LLM
		for (const source of sourcesWithContent) {
			const extractMessages: ChatMessage[] = [
				{
					role: "system",
					content: `You are a knowledge extraction AI. Extract key facts and insights from the provided source content.
You MUST respond with valid JSON:
{
  "facts": [
    { "fact": "A concise factual statement", "confidence": 0.0-1.0, "relevance": 0.0-1.0 }
  ]
}

Extract the most important and relevant facts. Each fact should be self-contained and useful for content generation.
Limit to 10-15 key facts per source.`,
				},
				{
					role: "user",
					content: `Source: ${source.title} (${source.type})\n\nContent:\n${source.parsedContent?.slice(0, 4000)}`,
				},
			];

			const factsResult = await chatCompletionJSON<KnowledgeFactsResult>(
				extractMessages,
				{ temperature: 0.3, maxTokens: 2048 },
			);

			// Create knowledge entries for each extracted fact
			for (const factItem of factsResult.facts) {
				const entry = await prisma.knowledgeEntry.create({
					data: {
						knowledgeBaseId: knowledgeBase.id,
						fact: factItem.fact,
						sourceRef: source.title,
						confidence: factItem.confidence,
						relevanceScore: factItem.relevance,
					},
				});

				knowledgeEntries.push({
					fact: entry.fact,
					sourceRef: source.title,
				});
			}
		}
	}

	await job.updateProgress(40);

	// Build the outline generation prompt
	const planContent = plan.content as object;
	const persona = session.sessionPersonas[0]?.persona;

	const systemPrompt = `You are a content outline architect. Generate a detailed, well-structured content outline based on the approved plan and available knowledge base.
You MUST respond with valid JSON matching this structure:
{
  "sections": [
    {
      "title": "Section title",
      "subsections": [
        {
          "title": "Subsection title",
          "keyPoints": ["Point 1", "Point 2"],
          "sourceRefs": ["Source name or reference"]
        }
      ]
    }
  ]
}

The outline should:
- Follow the structure suggested in the plan
- Incorporate knowledge base facts where relevant
- Include source references for traceability
- Be detailed enough to guide content generation
- Have logical flow and clear hierarchy`;

	let userPrompt = `**Approved Plan:**\n${JSON.stringify(planContent, null, 2)}`;

	if (knowledgeEntries.length > 0) {
		userPrompt += "\n\n**Knowledge Base Entries:**";
		for (const entry of knowledgeEntries) {
			userPrompt += `\n- [${entry.sourceRef}] ${entry.fact}`;
		}
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
		userPrompt += "\n\n**Available Sources:**";
		for (const source of sources) {
			userPrompt += `\n- ${source.title} (${source.type})`;
		}
	}

	await job.updateProgress(50);

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userPrompt },
	];

	// Generate the outline via LLM
	const outlineContent = await chatCompletionJSON<OutlineContent>(messages, {
		temperature: 0.7,
		maxTokens: 4096,
	});

	await job.updateProgress(70);

	// Update existing placeholder or create new outline
	const outline = job.data.outlineId
		? await prisma.outline.update({
				where: { id: job.data.outlineId },
				data: { content: outlineContent as object },
			})
		: await (async () => {
				const latestOutline = await prisma.outline.findFirst({
					where: { sessionId },
					orderBy: { version: "desc" },
				});
				return prisma.outline.create({
					data: {
						sessionId,
						planId,
						version: (latestOutline?.version ?? 0) + 1,
						content: outlineContent as object,
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
			createWsMessage<OutlineGeneratedPayload>(WS_EVENTS.OUTLINE_GENERATED, {
				sessionId,
				outlineId: outline.id,
				version: outline.version,
				status: outline.status,
				createdAt: outline.createdAt.toISOString(),
			}),
		);
	} catch {
		// WS server may not be initialized in test/worker-only contexts
	}

	// Auto-trigger critic review
	await criticReviewQueue.add("critic-review-outline", {
		sessionId,
		artifactType: "outline",
		artifactId: outline.id,
	});

	await job.updateProgress(100);
	console.log(
		`Outline generation completed for session ${sessionId}, outline ${outline.id} v${outline.version}`,
	);
}

export const outlineGenerationWorker = new Worker<OutlineGenerationJobData>(
	QueueName.OUTLINE_GENERATION,
	processOutlineGeneration,
	{
		connection,
		concurrency: 3,
		limiter: { max: 5, duration: 1000 },
	},
);

outlineGenerationWorker.on(
	"completed",
	(job: Job<OutlineGenerationJobData>) => {
		console.log(`Outline generation job ${job.id} completed`);
	},
);

outlineGenerationWorker.on(
	"failed",
	(job: Job<OutlineGenerationJobData> | undefined, error: Error) => {
		console.error(`Outline generation job ${job?.id} failed:`, error);
	},
);

outlineGenerationWorker.on("error", (error: Error) => {
	console.error("Outline generation worker error:", error);
});
