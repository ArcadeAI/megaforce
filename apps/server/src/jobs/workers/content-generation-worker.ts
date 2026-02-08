import prisma from "@megaforce/db";
import { type Job, Worker } from "bullmq";
import { type ChatMessage, chatCompletion } from "../../lib/llm";
import {
	type ContentGenerationCompletePayload,
	type ContentGenerationProgressPayload,
	type EventPayload,
	RoomType,
	WS_EVENTS,
	type WsEventType,
} from "../../websocket/events";
import { getWsServer } from "../../websocket/server";
import {
	type ContentGenerationJobData,
	connection,
	criticReviewQueue,
	QueueName,
} from "../queue";

interface OutlineSection {
	title: string;
	subsections: Array<{
		title: string;
		keyPoints: string[];
	}>;
}

interface GeneratedSection {
	title: string;
	content: string;
	outlineSectionIndex: number;
}

/**
 * Extract sections from outline content, handling multiple formats:
 * 1. Structured JSON: { sections: [{ title, subsections }] }
 * 2. Nested/wrapped JSON: { outline: { sections: [...] } } or similar
 * 3. Array at top level: [{ title, subsections }]
 * 4. Markdown string: parse headings into sections
 */
function extractOutlineSections(content: unknown): OutlineSection[] {
	if (!content) return [];

	// Handle string content (markdown from user edits)
	if (typeof content === "string") {
		return parseMarkdownToSections(content);
	}

	if (typeof content !== "object") return [];

	// Direct { sections: [...] } format
	const obj = content as Record<string, unknown>;
	if (Array.isArray(obj.sections) && obj.sections.length > 0) {
		return normalizeSections(obj.sections);
	}

	// Top-level array
	if (Array.isArray(content) && content.length > 0) {
		return normalizeSections(content);
	}

	// Nested wrapper: look one level deep for a sections array
	for (const value of Object.values(obj)) {
		if (value && typeof value === "object") {
			if (Array.isArray(value) && value.length > 0) {
				const normalized = normalizeSections(value);
				if (normalized.length > 0) return normalized;
			}
			const nested = value as Record<string, unknown>;
			if (Array.isArray(nested.sections) && nested.sections.length > 0) {
				return normalizeSections(nested.sections);
			}
		}
	}

	return [];
}

function normalizeSections(items: unknown[]): OutlineSection[] {
	return items
		.filter(
			(item): item is Record<string, unknown> =>
				typeof item === "object" && item !== null && "title" in item,
		)
		.map((item) => ({
			title: String(item.title),
			subsections: Array.isArray(item.subsections)
				? item.subsections.map((sub: Record<string, unknown>) => ({
						title: String(sub.title ?? ""),
						keyPoints: Array.isArray(sub.keyPoints)
							? sub.keyPoints.map(String)
							: [],
					}))
				: [],
		}));
}

function parseMarkdownToSections(markdown: string): OutlineSection[] {
	const lines = markdown.split("\n");
	const sections: OutlineSection[] = [];
	let currentSection: OutlineSection | null = null;
	let currentSubsection: { title: string; keyPoints: string[] } | null = null;

	for (const line of lines) {
		const h2Match = line.match(/^##\s+(.+)/);
		const h3Match = line.match(/^###\s+(.+)/);
		const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);

		if (h2Match?.[1]) {
			if (currentSection) sections.push(currentSection);
			currentSection = {
				title: h2Match[1].replace(/^\d+\.\s*/, ""),
				subsections: [],
			};
			currentSubsection = null;
		} else if (h3Match?.[1] && currentSection) {
			currentSubsection = {
				title: h3Match[1].replace(/^\d+\.\d+\s*/, ""),
				keyPoints: [],
			};
			currentSection.subsections.push(currentSubsection);
		} else if (bulletMatch?.[1]) {
			if (currentSubsection) {
				currentSubsection.keyPoints.push(bulletMatch[1]);
			} else if (currentSection) {
				// Bullet under a section with no subsection — add as a subsection
				currentSection.subsections.push({
					title: bulletMatch[1],
					keyPoints: [],
				});
			}
		}
	}
	if (currentSection) sections.push(currentSection);

	// If no h2 headings were found, treat the whole content as one section
	if (sections.length === 0 && markdown.trim().length > 0) {
		sections.push({
			title: "Content",
			subsections: [{ title: "Main", keyPoints: [markdown.trim()] }],
		});
	}

	return sections;
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
		// WS server may not be initialized in test/worker-only contexts
	}
}

async function processContentGeneration(
	job: Job<ContentGenerationJobData>,
): Promise<void> {
	const { sessionId, outlineId } = job.data;

	console.log(`Processing content generation job ${job.id}`, {
		sessionId,
		outlineId,
	});

	// Fetch session with personas
	const session = await prisma.contentSession.findUnique({
		where: { id: sessionId },
		include: {
			sessionPersonas: {
				include: { persona: true },
			},
		},
	});

	if (!session) {
		throw new Error(`Session ${sessionId} not found`);
	}

	// Fetch the outline
	const outline = await prisma.outline.findUnique({
		where: { id: outlineId },
	});

	if (!outline) {
		throw new Error(`Outline ${outlineId} not found`);
	}

	await job.updateProgress(5);

	// Fetch knowledge base entries for this session
	const knowledgeBase = await prisma.knowledgeBase.findFirst({
		where: { sessionId },
	});

	let knowledgeEntries: Array<{
		fact: string;
		sourceRef: string | null;
		confidence: number;
		relevanceScore: number;
	}> = [];

	if (knowledgeBase) {
		knowledgeEntries = await prisma.knowledgeEntry.findMany({
			where: { knowledgeBaseId: knowledgeBase.id },
			orderBy: { relevanceScore: "desc" },
		});
	}

	await job.updateProgress(10);

	// Extract session context
	const outputTypes = (session.outputTypes as string[]) ?? [];
	const clarifying =
		(session.clarifyingAnswers as Record<string, string>) ?? {};
	const persona = session.sessionPersonas[0]?.persona;

	// Extract sections from outline content, handling various formats
	const sections = extractOutlineSections(outline.content);

	if (sections.length === 0) {
		throw new Error(
			`Outline ${outlineId} has no sections to generate content for`,
		);
	}
	const totalSections = sections.length;

	// Build overall context string
	let overallContext = `Output types: ${outputTypes.join(", ") || "General content"}`;
	overallContext += `\nTone: ${clarifying.tone || "Professional"}`;
	overallContext += `\nAudience: ${clarifying.audience || "General audience"}`;
	if (clarifying.keywords)
		overallContext += `\nKeywords: ${clarifying.keywords}`;
	if (clarifying.additionalContext)
		overallContext += `\nAdditional context: ${clarifying.additionalContext}`;

	// Build persona style instructions
	let personaInstructions = "";
	if (persona) {
		personaInstructions += `\n\nWriting Persona: ${persona.name}`;
		if (persona.description) {
			personaInstructions += ` - ${persona.description}`;
		}
		const style = persona.styleProfile as Record<string, string> | null;
		if (style) {
			personaInstructions += `\nStyle attributes: tone=${style.tone || "professional"}, formality=${style.formality || "moderate"}`;
			if (style.vocabulary)
				personaInstructions += `, vocabulary=${style.vocabulary}`;
			if (style.sentence_style)
				personaInstructions += `, sentence_style=${style.sentence_style}`;
		}
		if (persona.vocabularyLevel)
			personaInstructions += `\nVocabulary level: ${persona.vocabularyLevel}`;
		if (persona.perspective)
			personaInstructions += `\nPerspective: ${persona.perspective}`;
		if (persona.sentenceStyle)
			personaInstructions += `\nSentence style: ${persona.sentenceStyle}`;
		if (persona.sampleOutput)
			personaInstructions += `\nSample output for style reference:\n${persona.sampleOutput.slice(0, 500)}`;
	}

	// Build knowledge base context string
	let kbContext = "";
	if (knowledgeEntries.length > 0) {
		kbContext = "\n\nRelevant Knowledge Base Facts:";
		for (const entry of knowledgeEntries.slice(0, 20)) {
			kbContext += `\n- ${entry.fact}`;
			if (entry.sourceRef) kbContext += ` [Source: ${entry.sourceRef}]`;
		}
	}

	// Full outline summary for context
	const outlineSummary = sections
		.map(
			(s, i) =>
				`${i + 1}. ${s.title}${s.subsections?.length ? ` (${s.subsections.map((sub) => sub.title).join(", ")})` : ""}`,
		)
		.join("\n");

	// Generate content section by section
	const generatedSections: GeneratedSection[] = [];

	for (const [sectionIndex, section] of sections.entries()) {
		const progress = Math.round(10 + ((sectionIndex + 1) / totalSections) * 70);

		// Build section-specific details
		let sectionDetails = `Section ${sectionIndex + 1} of ${totalSections}: "${section.title}"`;
		if (section.subsections?.length > 0) {
			sectionDetails += "\nSubsections:";
			for (const sub of section.subsections) {
				sectionDetails += `\n  - ${sub.title}`;
				if (sub.keyPoints?.length > 0) {
					sectionDetails += `: ${sub.keyPoints.join("; ")}`;
				}
			}
		}

		// Previously generated sections for continuity
		let previousContent = "";
		if (generatedSections.length > 0) {
			previousContent =
				"\n\nPreviously generated sections (for continuity and flow):\n";
			for (const prev of generatedSections) {
				previousContent += `\n--- ${prev.title} ---\n${prev.content.slice(0, 300)}...\n`;
			}
		}

		const systemPrompt = `You are an expert content writer. Generate high-quality, engaging content for the specified section of a larger piece.

Write ONLY the content for this specific section. Do not include the section title as a heading — it will be added separately.
Ensure smooth, natural prose that would flow well from the previous section and into the next.
Incorporate relevant facts from the knowledge base naturally into the text.
${personaInstructions}`;

		const userPrompt = `Overall Content Context:
${overallContext}

Full Outline:
${outlineSummary}
${kbContext}
${previousContent}

Now write the content for:
${sectionDetails}

Write comprehensive, well-structured content for this section. Use appropriate paragraph breaks and ensure the content addresses all subsection topics and key points.`;

		const messages: ChatMessage[] = [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		];

		const sectionContent = await chatCompletion(messages, {
			temperature: 0.7,
			maxTokens: 4096,
		});

		generatedSections.push({
			title: section.title,
			content: sectionContent,
			outlineSectionIndex: sectionIndex,
		});

		// Broadcast progress
		broadcastSafe(
			WS_EVENTS.CONTENT_GENERATION_PROGRESS,
			{
				sessionId,
				contentId: "", // Not yet created
				sectionIndex,
				totalSections,
				sectionTitle: section.title,
				progress,
			} satisfies Omit<ContentGenerationProgressPayload, "contentId"> & {
				contentId: string;
			},
			sessionId,
		);

		await job.updateProgress(progress);
	}

	await job.updateProgress(85);

	// Assemble all sections into full content with transitions
	const contentParts: string[] = [];
	for (const section of generatedSections) {
		contentParts.push(`## ${section.title}\n\n${section.content}`);
	}
	const fullContent = contentParts.join("\n\n");

	// Calculate metrics
	const wordCount = fullContent.split(/\s+/).filter((w) => w.length > 0).length;
	const readingTime = Math.ceil(wordCount / 200);

	await job.updateProgress(90);

	// Update existing placeholder or create new content record
	const generatedContent = job.data.contentId
		? await prisma.generatedContent.update({
				where: { id: job.data.contentId },
				data: {
					content: fullContent,
					sections: generatedSections as object[],
					metrics: { wordCount, readingTime } as object,
				},
			})
		: await (async () => {
				const latestContent = await prisma.generatedContent.findFirst({
					where: { sessionId, outlineId },
					orderBy: { version: "desc" },
				});
				return prisma.generatedContent.create({
					data: {
						sessionId,
						outlineId,
						version: (latestContent?.version ?? 0) + 1,
						content: fullContent,
						sections: generatedSections as object[],
						status: "DRAFT",
						criticIterations: 0,
						metrics: { wordCount, readingTime } as object,
					},
				});
			})();

	await job.updateProgress(95);

	// Broadcast content generation complete
	broadcastSafe(
		WS_EVENTS.CONTENT_GENERATION_COMPLETE,
		{
			sessionId,
			contentId: generatedContent.id,
			version: generatedContent.version,
			status: generatedContent.status,
			createdAt: generatedContent.createdAt.toISOString(),
		} satisfies ContentGenerationCompletePayload,
		sessionId,
	);

	// Auto-trigger critic review
	await criticReviewQueue.add("critic-review-content", {
		sessionId,
		artifactType: "content",
		artifactId: generatedContent.id,
	});

	await job.updateProgress(100);
	console.log(
		`Content generation completed for session ${sessionId}, content ${generatedContent.id} v${generatedContent.version} (${wordCount} words, ~${readingTime} min read)`,
	);
}

export const contentGenerationWorker = new Worker<ContentGenerationJobData>(
	QueueName.CONTENT_GENERATION,
	processContentGeneration,
	{
		connection,
		concurrency: 3,
		limiter: { max: 5, duration: 1000 },
	},
);

contentGenerationWorker.on(
	"completed",
	(job: Job<ContentGenerationJobData>) => {
		console.log(`Content generation job ${job.id} completed`);
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
