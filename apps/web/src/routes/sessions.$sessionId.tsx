import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SessionEditor } from "@/components/editor/session-editor";
import { PersonaForm } from "@/components/persona-form";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@/lib/api/sessions";
import { sessionsApi } from "@/lib/api/sessions";
import { authClient } from "@/lib/auth-client";
import { usePersonas } from "@/lib/hooks/use-personas";
import {
	useAdvanceStage,
	useApproveContent,
	useApproveOutline,
	useApprovePlan,
	useContent,
	useEditContent,
	useEditOutline,
	useEditPlan,
	useGenerateContent,
	useGenerateOutline,
	useGeneratePlan,
	useGoBack,
	useOutline,
	usePlan,
	useSession,
} from "@/lib/hooks/use-sessions";

export const Route = createFileRoute("/sessions/$sessionId")({
	component: SessionDetailPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

// ============================================================================
// Constants
// ============================================================================

const STAGES = [
	"OUTPUT_SELECTION",
	"CLARIFYING",
	"PERSONA",
	"PLAN",
	"OUTLINE",
	"GENERATION",
	"COMPLETE",
] as const;

const STAGE_LABELS: Record<string, string> = {
	OUTPUT_SELECTION: "Output Selection",
	CLARIFYING: "Clarifying",
	PERSONA: "Persona",
	PLAN: "Plan",
	OUTLINE: "Outline",
	GENERATION: "Generation",
	COMPLETE: "Complete",
};

const OUTPUT_TYPES = [
	{
		value: "BLOG_POST",
		label: "Blog Post",
		description: "Long-form blog content with SEO optimization",
	},
	{
		value: "ARTICLE",
		label: "Article",
		description: "In-depth articles for publications or knowledge bases",
	},
	{
		value: "SOCIAL_MEDIA",
		label: "Social Media",
		description: "Short-form posts for social platforms",
	},
	{
		value: "TECHNICAL_DOCS",
		label: "Technical Docs",
		description: "Technical documentation and guides",
	},
	{
		value: "MARKETING_COPY",
		label: "Marketing Copy",
		description: "Persuasive marketing and advertising content",
	},
	{
		value: "CUSTOM",
		label: "Custom",
		description: "Define your own output format and structure",
	},
] as const;

const TONE_OPTIONS = [
	"Professional",
	"Casual",
	"Academic",
	"Conversational",
	"Authoritative",
	"Friendly",
	"Formal",
	"Humorous",
];

const DATA_SOURCE_MODES = [
	{
		value: "CORPUS_ONLY",
		label: "Corpus Only",
		description: "Use only the provided source materials",
	},
	{
		value: "DEEP_RESEARCH",
		label: "Deep Research",
		description: "AI-powered research to supplement sources",
	},
	{
		value: "BOTH",
		label: "Both",
		description: "Combine corpus materials with deep research",
	},
] as const;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert plan content to a displayable markdown string.
 * New plans are stored as markdown strings; legacy plans are JSON objects.
 */
function planContentToMarkdown(content: unknown): string {
	if (typeof content === "string") return content;
	// Legacy JSON plan — render as readable markdown
	const plan = content as Record<string, unknown>;
	const lines: string[] = [];
	if (plan.executiveSummary) {
		lines.push("## Executive Summary", String(plan.executiveSummary), "");
	}
	if (plan.targetAudience) {
		lines.push("## Target Audience", String(plan.targetAudience), "");
	}
	if (Array.isArray(plan.keyMessages) && plan.keyMessages.length > 0) {
		lines.push("## Key Messages");
		for (const msg of plan.keyMessages) lines.push(`- ${msg}`);
		lines.push("");
	}
	const structure = plan.contentStructure as Record<string, unknown> | null;
	if (structure) {
		lines.push("## Content Structure");
		if (structure.format) lines.push(`**Format:** ${structure.format}`);
		if (structure.estimatedLength)
			lines.push(`**Estimated Length:** ${structure.estimatedLength}`);
		const sections = structure.sections as
			| Array<{ title: string; purpose: string }>
			| undefined;
		if (sections?.length) {
			lines.push("");
			for (const s of sections) lines.push(`- **${s.title}** — ${s.purpose}`);
		}
		lines.push("");
	}
	if (Array.isArray(plan.successCriteria) && plan.successCriteria.length > 0) {
		lines.push("## Success Criteria");
		for (const c of plan.successCriteria) lines.push(`- ${c}`);
		lines.push("");
	}
	if (plan.toneAndStyle) {
		lines.push("## Tone & Style", String(plan.toneAndStyle), "");
	}
	// If we couldn't extract anything meaningful, fall back to formatted JSON
	if (lines.length === 0) return JSON.stringify(content, null, 2);
	return lines.join("\n");
}

/**
 * Convert outline content to a displayable markdown string.
 * Outlines may be stored as markdown strings or structured JSON objects.
 */
function outlineContentToMarkdown(content: unknown): string {
	if (typeof content === "string") return content;
	const structured = content as {
		sections?: Array<{
			title: string;
			subsections?: Array<{ title: string; keyPoints?: string[] }>;
			keyPoints?: string[];
		}>;
	};
	if (structured?.sections) {
		const lines: string[] = [];
		for (let i = 0; i < structured.sections.length; i++) {
			const section = structured.sections[i];
			lines.push(`## ${i + 1}. ${section.title}`);
			if (section.keyPoints) {
				for (const point of section.keyPoints) lines.push(`- ${point}`);
			}
			if (section.subsections) {
				for (let k = 0; k < section.subsections.length; k++) {
					const sub = section.subsections[k];
					lines.push(`### ${i + 1}.${k + 1} ${sub.title}`);
					if (sub.keyPoints) {
						for (const point of sub.keyPoints) lines.push(`- ${point}`);
					}
				}
			}
			lines.push("");
		}
		return lines.join("\n");
	}
	return JSON.stringify(content, null, 2);
}

// ============================================================================
// Stage Stepper
// ============================================================================

function StageStepper({
	currentStage,
	viewingStage,
	onStageClick,
}: {
	currentStage: string;
	viewingStage: string;
	onStageClick: (stage: string) => void;
}) {
	const currentIndex = STAGES.indexOf(currentStage as (typeof STAGES)[number]);

	return (
		<div className="flex items-center gap-1 overflow-x-auto border-border border-b px-4 py-2">
			{STAGES.map((stage, index) => {
				const isComplete = index < currentIndex;
				const isCurrent = index === currentIndex;
				const isViewing = stage === viewingStage;

				return (
					<div key={stage} className="flex items-center">
						{index > 0 && (
							<div
								className={`mx-1 h-px w-4 ${
									isComplete ? "bg-primary" : "bg-border"
								}`}
							/>
						)}
						<button
							type="button"
							disabled={!isComplete && !isCurrent}
							onClick={() => {
								if (isComplete || isCurrent) onStageClick(stage);
							}}
							className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] transition-colors ${
								isViewing
									? "bg-primary/15 font-medium text-primary"
									: isComplete
										? "cursor-pointer text-primary/70 hover:bg-primary/10"
										: isCurrent
											? "text-primary"
											: "text-muted-foreground"
							}`}
						>
							<span
								className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] ${
									isComplete
										? "bg-primary text-primary-foreground"
										: isCurrent
											? "border border-primary text-primary"
											: "border border-muted-foreground/40 text-muted-foreground"
								}`}
							>
								{isComplete ? "\u2713" : index + 1}
							</span>
							<span className="hidden whitespace-nowrap sm:inline">
								{STAGE_LABELS[stage]}
							</span>
						</button>
					</div>
				);
			})}
		</div>
	);
}

// ============================================================================
// Critic Feedback Panel
// ============================================================================

interface CriticFeedbackEntry {
	iteration: number;
	approved: boolean;
	score: number;
	objections: string[];
	suggestions: string[];
	summary: string;
	timestamp: string;
}

function CriticFeedbackPanel({
	criticFeedback,
	criticIterations,
}: {
	criticFeedback: unknown[] | null;
	criticIterations: number;
}) {
	const [isOpen, setIsOpen] = useState(false);

	if (!criticFeedback || criticFeedback.length === 0) return null;

	const entries = criticFeedback as CriticFeedbackEntry[];
	const reversed = [...entries].reverse();

	const scoreColor = (score: number) => {
		if (score >= 8) return "bg-green-500/20 text-green-400";
		if (score >= 5) return "bg-amber-500/20 text-amber-400";
		return "bg-red-500/20 text-red-400";
	};

	return (
		<div className="border border-border">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
			>
				<span className="font-medium text-xs">
					Critic Feedback ({criticIterations} iteration
					{criticIterations !== 1 ? "s" : ""})
				</span>
				<span className="text-muted-foreground text-xs">
					{isOpen ? "\u25B2" : "\u25BC"}
				</span>
			</button>

			{isOpen && (
				<div className="space-y-3 border-border border-t px-4 py-3">
					{reversed.map((entry) => (
						<div
							key={entry.iteration}
							className="space-y-2 border border-border p-3"
						>
							<div className="flex items-center gap-2">
								<span className="text-[10px] text-muted-foreground">
									Iteration {entry.iteration}
								</span>
								<span
									className={`rounded-sm px-1.5 py-0.5 font-medium text-[10px] ${scoreColor(entry.score)}`}
								>
									{entry.score}/10
								</span>
								<span
									className={`rounded-sm px-1.5 py-0.5 text-[10px] ${
										entry.approved
											? "bg-green-500/20 text-green-400"
											: "bg-red-500/20 text-red-400"
									}`}
								>
									{entry.approved ? "Approved" : "Rejected"}
								</span>
								{entry.timestamp && (
									<span className="ml-auto text-[10px] text-muted-foreground">
										{new Date(entry.timestamp).toLocaleString()}
									</span>
								)}
							</div>

							{entry.summary && (
								<p className="text-xs leading-relaxed">{entry.summary}</p>
							)}

							{entry.objections.length > 0 && (
								<div>
									<span className="font-medium text-[10px] text-red-400">
										Objections
									</span>
									<ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground text-xs">
										{entry.objections.map((obj) => (
											<li key={obj}>{obj}</li>
										))}
									</ul>
								</div>
							)}

							{entry.suggestions.length > 0 && (
								<div>
									<span className="font-medium text-[10px] text-blue-400">
										Suggestions
									</span>
									<ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground text-xs">
										{entry.suggestions.map((sug) => (
											<li key={sug}>{sug}</li>
										))}
									</ul>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// ============================================================================
// Read-only Stage Views (for viewing completed stages)
// ============================================================================

function ReadOnlyOutputSelection({ session }: { session: Session }) {
	const selected = session.outputTypes ?? [];
	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Output Selection</h2>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{OUTPUT_TYPES.filter((t) => selected.includes(t.value)).map((type) => (
					<Card key={type.value} className="border-primary/30 bg-primary/5">
						<CardHeader>
							<CardTitle>{type.label}</CardTitle>
							<CardDescription>{type.description}</CardDescription>
						</CardHeader>
					</Card>
				))}
			</div>
		</div>
	);
}

function ReadOnlyClarifying({ session }: { session: Session }) {
	const answers = (session.clarifyingAnswers as Record<string, string>) ?? {};
	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Clarifying Details</h2>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{answers.tone && (
					<div>
						<Label className="text-muted-foreground">Tone</Label>
						<p className="text-xs">{answers.tone}</p>
					</div>
				)}
				{answers.audience && (
					<div>
						<Label className="text-muted-foreground">Audience</Label>
						<p className="text-xs">{answers.audience}</p>
					</div>
				)}
				{answers.keywords && (
					<div>
						<Label className="text-muted-foreground">Keywords</Label>
						<p className="text-xs">{answers.keywords}</p>
					</div>
				)}
				{answers.additionalContext && (
					<div className="lg:col-span-2">
						<Label className="text-muted-foreground">Additional Context</Label>
						<p className="whitespace-pre-wrap text-xs">
							{answers.additionalContext}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

function ReadOnlyPersona({ session }: { session: Session }) {
	const persona = session.sessionPersonas?.[0];
	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Selected Persona</h2>
			{persona ? (
				<Card className="border-primary/30 bg-primary/5">
					<CardHeader>
						<CardTitle>{persona.persona?.name ?? "Persona"}</CardTitle>
					</CardHeader>
					{persona.persona?.description && (
						<CardContent>
							<p className="text-muted-foreground text-xs">
								{persona.persona.description}
							</p>
						</CardContent>
					)}
				</Card>
			) : (
				<p className="text-muted-foreground text-xs">No persona selected.</p>
			)}
		</div>
	);
}

function ReadOnlyPlan({ session }: { session: Session }) {
	const { data: plan } = usePlan(session.id);

	if (!plan) {
		return (
			<div className="space-y-4">
				<h2 className="font-semibold text-lg">Content Plan</h2>
				<p className="text-muted-foreground text-xs">No plan data available.</p>
			</div>
		);
	}

	const contentMd = planContentToMarkdown(plan.content);

	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Content Plan</h2>
			<Card>
				<CardHeader>
					<CardTitle>Plan v{plan.version}</CardTitle>
				</CardHeader>
				<CardContent>
					<SessionEditor content={contentMd} editable={false} markdown />
				</CardContent>
			</Card>
			<CriticFeedbackPanel
				criticFeedback={plan.criticFeedback}
				criticIterations={plan.criticIterations}
			/>
		</div>
	);
}

function ReadOnlyOutline({ session }: { session: Session }) {
	const { data: outline } = useOutline(session.id);

	if (!outline) {
		return (
			<div className="space-y-4">
				<h2 className="font-semibold text-lg">Content Outline</h2>
				<p className="text-muted-foreground text-xs">
					No outline data available.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Content Outline</h2>
			<Card>
				<CardHeader>
					<CardTitle>Outline v{outline.version}</CardTitle>
				</CardHeader>
				<CardContent>
					<ReadOnlyOutlineContent content={outline.content} />
				</CardContent>
			</Card>
			<CriticFeedbackPanel
				criticFeedback={outline.criticFeedback}
				criticIterations={outline.criticIterations}
			/>
		</div>
	);
}

function ReadOnlyOutlineContent({ content }: { content: unknown }) {
	if (typeof content === "string") {
		return (
			<div className="whitespace-pre-wrap text-xs leading-relaxed">
				{content}
			</div>
		);
	}

	const structured = content as {
		sections?: Array<{
			title: string;
			subsections?: Array<{ title: string; keyPoints?: string[] }>;
			keyPoints?: string[];
		}>;
	};

	if (structured?.sections) {
		return (
			<div className="space-y-4">
				{structured.sections.map((section, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: LLM-generated sections have no stable ID
					<div key={`ro-section-${i}`} className="space-y-2">
						<h4 className="font-semibold text-sm">
							{i + 1}. {section.title}
						</h4>
						{section.keyPoints && (
							<ul className="ml-4 list-disc space-y-1 text-muted-foreground text-xs">
								{section.keyPoints.map((point, j) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: LLM-generated points have no stable ID
									<li key={`ro-point-${i}-${j}`}>{point}</li>
								))}
							</ul>
						)}
						{section.subsections?.map((sub, k) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: LLM-generated subsections have no stable ID
							<div key={`ro-sub-${i}-${k}`} className="ml-4 space-y-1">
								<h5 className="font-medium text-xs">
									{i + 1}.{k + 1} {sub.title}
								</h5>
								{sub.keyPoints && (
									<ul className="ml-4 list-disc space-y-0.5 text-muted-foreground text-xs">
										{sub.keyPoints.map((point, l) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: LLM-generated points have no stable ID
											<li key={`ro-subpoint-${i}-${k}-${l}`}>{point}</li>
										))}
									</ul>
								)}
							</div>
						))}
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="whitespace-pre-wrap text-xs leading-relaxed">
			{JSON.stringify(content, null, 2)}
		</div>
	);
}

function ReadOnlyGeneration({ session }: { session: Session }) {
	const { data: content } = useContent(session.id);

	if (!content) {
		return (
			<div className="space-y-4">
				<h2 className="font-semibold text-lg">Generated Content</h2>
				<p className="text-muted-foreground text-xs">
					No content data available.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Generated Content</h2>
			<Card>
				<CardHeader>
					<CardTitle>Content v{content.version}</CardTitle>
				</CardHeader>
				<CardContent>
					<SessionEditor content={content.content} editable={false} markdown />
				</CardContent>
			</Card>
			<CriticFeedbackPanel
				criticFeedback={content.criticFeedback}
				criticIterations={content.criticIterations}
			/>
		</div>
	);
}

// ============================================================================
// Stage: Output Selection
// ============================================================================

function OutputSelectionStage({ session }: { session: Session }) {
	const [selectedType, setSelectedType] = useState<string | null>(
		session.outputTypes?.[0] ?? null,
	);
	const advanceStage = useAdvanceStage();

	const handleContinue = () => {
		if (!selectedType) return;
		advanceStage.mutate({
			id: session.id,
			stageData: { outputTypes: [selectedType] },
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-lg">Select Output Type</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Choose a content format to generate.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{OUTPUT_TYPES.map((type) => {
					const isSelected = selectedType === type.value;
					return (
						<Card
							key={type.value}
							className={`cursor-pointer transition-colors ${
								isSelected
									? "border-primary bg-primary/5 ring-primary"
									: "hover:bg-muted/50"
							}`}
							onClick={() => setSelectedType(type.value)}
						>
							<CardHeader>
								<div className="flex items-start justify-between">
									<CardTitle>{type.label}</CardTitle>
									<div
										className={`size-3 rounded-full border-2 ${
											isSelected
												? "border-primary bg-primary"
												: "border-muted-foreground/40"
										}`}
									/>
								</div>
								<CardDescription>{type.description}</CardDescription>
							</CardHeader>
						</Card>
					);
				})}
			</div>

			<div className="flex justify-end">
				<Button
					onClick={handleContinue}
					disabled={!selectedType || advanceStage.isPending}
				>
					{advanceStage.isPending ? "Saving..." : "Continue"}
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// Stage: Clarifying
// ============================================================================

function ClarifyingStage({ session }: { session: Session }) {
	const existing = (session.clarifyingAnswers as Record<string, string>) ?? {};
	const existingSources = (session.sessionSources ?? []).map((ss) => ({
		type: ss.source.type,
		value: ss.source.url ?? "",
	}));

	const [tone, setTone] = useState(existing.tone ?? "");
	const [audience, setAudience] = useState(existing.audience ?? "");
	const [keywords, setKeywords] = useState(existing.keywords ?? "");
	const [additionalContext, setAdditionalContext] = useState(
		existing.additionalContext ?? "",
	);
	const [dataSourceMode, setDataSourceMode] = useState(
		session.dataSourceMode ?? "CORPUS_ONLY",
	);
	const [sources, setSources] = useState<
		Array<{ type: string; value: string }>
	>(
		existingSources.length > 0 ? existingSources : [{ type: "URL", value: "" }],
	);

	const advanceStage = useAdvanceStage();

	const addSource = () => {
		setSources((prev) => [...prev, { type: "URL", value: "" }]);
	};

	const removeSource = (index: number) => {
		setSources((prev) => prev.filter((_, i) => i !== index));
	};

	const updateSource = (
		index: number,
		field: "type" | "value",
		val: string,
	) => {
		setSources((prev) =>
			prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)),
		);
	};

	const handleContinue = () => {
		const clarifyingAnswers = {
			tone,
			audience,
			keywords,
			additionalContext,
		};
		const filteredSources = sources.filter((s) => s.value.trim() !== "");
		advanceStage.mutate({
			id: session.id,
			stageData: {
				clarifyingAnswers,
				dataSourceMode,
				sources: filteredSources,
			},
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-lg">Provide Details</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Help us understand the tone, audience, and context for your content.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Left column */}
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="tone">Tone</Label>
						<select
							id="tone"
							value={tone}
							onChange={(e) => setTone(e.target.value)}
							className="flex h-8 w-full rounded-none border border-input bg-transparent px-2.5 py-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
						>
							<option value="">Select a tone...</option>
							{TONE_OPTIONS.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="audience">Target Audience</Label>
						<Input
							id="audience"
							placeholder="e.g., Software engineers, Marketing managers..."
							value={audience}
							onChange={(e) => setAudience(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="keywords">Keywords</Label>
						<Input
							id="keywords"
							placeholder="Comma-separated keywords..."
							value={keywords}
							onChange={(e) => setKeywords(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="context">Additional Context</Label>
						<textarea
							id="context"
							placeholder="Any additional context, goals, or requirements..."
							value={additionalContext}
							onChange={(e) => setAdditionalContext(e.target.value)}
							rows={4}
							className="flex w-full rounded-none border border-input bg-transparent px-2.5 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
						/>
					</div>
				</div>

				{/* Right column */}
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Data Source Mode</Label>
						<div className="space-y-2">
							{DATA_SOURCE_MODES.map((mode) => (
								<label
									key={mode.value}
									className={`flex cursor-pointer items-start gap-3 rounded-none border p-3 transition-colors ${
										dataSourceMode === mode.value
											? "border-primary bg-primary/5"
											: "border-border hover:bg-muted/50"
									}`}
								>
									<input
										type="radio"
										name="dataSourceMode"
										value={mode.value}
										checked={dataSourceMode === mode.value}
										onChange={(e) => setDataSourceMode(e.target.value)}
										className="mt-0.5"
									/>
									<div>
										<span className="font-medium text-xs">{mode.label}</span>
										<p className="text-[11px] text-muted-foreground">
											{mode.description}
										</p>
									</div>
								</label>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Sources</Label>
							<Button size="xs" variant="outline" onClick={addSource}>
								+ Add
							</Button>
						</div>
						<div className="space-y-2">
							{sources.map((source, index) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: sources have no stable ID
									key={`source-${index}`}
									className="flex items-center gap-2"
								>
									<select
										value={source.type}
										onChange={(e) =>
											updateSource(index, "type", e.target.value)
										}
										className="h-8 shrink-0 rounded-none border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
									>
										<option value="URL">URL</option>
										<option value="TEXT">Text</option>
									</select>
									<Input
										placeholder={
											source.type === "URL"
												? "https://example.com/..."
												: "Paste text content..."
										}
										value={source.value}
										onChange={(e) =>
											updateSource(index, "value", e.target.value)
										}
									/>
									{sources.length > 1 && (
										<Button
											size="icon-xs"
											variant="ghost"
											onClick={() => removeSource(index)}
										>
											x
										</Button>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleContinue} disabled={advanceStage.isPending}>
					{advanceStage.isPending ? "Saving..." : "Continue"}
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// Stage: Persona
// ============================================================================

function PersonaStage({ session }: { session: Session }) {
	const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
		session.sessionPersonas?.[0]?.personaId ?? null,
	);
	const { data: personas, isLoading: personasLoading } = usePersonas();
	const advanceStage = useAdvanceStage();
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	const handleContinue = () => {
		if (!selectedPersonaId) return;
		advanceStage.mutate({
			id: session.id,
			stageData: { personaIds: [selectedPersonaId] },
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h2 className="font-semibold text-lg">Select a Persona</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						Choose a writing persona to define the voice and style of your
						content.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowCreateDialog(true)}
				>
					+ Create New
				</Button>
			</div>

			{personasLoading && (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
						<Skeleton key={`persona-skeleton-${i}`} className="h-24 w-full" />
					))}
				</div>
			)}

			{!personasLoading && personas && personas.length === 0 && (
				<Card>
					<CardContent className="py-8 text-center">
						<p className="text-muted-foreground text-sm">
							No personas available yet.
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => setShowCreateDialog(true)}
						>
							Create Your First Persona
						</Button>
					</CardContent>
				</Card>
			)}

			{!personasLoading && personas && personas.length > 0 && (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{personas.map((persona) => {
						const isSelected = selectedPersonaId === persona.id;
						return (
							<Card
								key={persona.id}
								className={`cursor-pointer transition-colors ${
									isSelected
										? "border-primary bg-primary/5 ring-primary"
										: "hover:bg-muted/50"
								}`}
								onClick={() => setSelectedPersonaId(persona.id)}
							>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<CardTitle>{persona.name}</CardTitle>
											{persona.vocabularyLevel && (
												<CardDescription className="mt-1">
													{persona.vocabularyLevel} level
												</CardDescription>
											)}
										</div>
										<div
											className={`size-3 rounded-full border-2 ${
												isSelected
													? "border-primary bg-primary"
													: "border-muted-foreground/40"
											}`}
										/>
									</div>
								</CardHeader>
								{persona.description && (
									<CardContent>
										<p className="text-muted-foreground text-xs">
											{persona.description}
										</p>
									</CardContent>
								)}
							</Card>
						);
					})}
				</div>
			)}

			<div className="flex justify-end">
				<Button
					onClick={handleContinue}
					disabled={!selectedPersonaId || advanceStage.isPending}
				>
					{advanceStage.isPending ? "Saving..." : "Continue"}
				</Button>
			</div>

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Create New Persona</DialogTitle>
						<DialogDescription>
							Quickly create a persona to use in this session.
						</DialogDescription>
					</DialogHeader>
					<PersonaForm
						compact
						onSuccess={(created) => {
							setShowCreateDialog(false);
							setSelectedPersonaId(created.id);
						}}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ============================================================================
// Stage: Plan
// ============================================================================

function PlanStage({ session }: { session: Session }) {
	const {
		data: plan,
		isLoading: planLoading,
		error: planError,
	} = usePlan(session.id, {
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === "DRAFT" || status === "CRITIC_REVIEWING") return 3000;
			return false;
		},
	});
	const generatePlan = useGeneratePlan();
	const approvePlan = useApprovePlan();
	const rejectPlan = useGoBack();
	const editPlan = useEditPlan();
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState("");

	const hasPlan = plan && !planError;
	const isInProgress =
		hasPlan && (plan.status === "DRAFT" || plan.status === "CRITIC_REVIEWING");
	const isReady =
		hasPlan &&
		(plan.status === "CRITIC_APPROVED" || plan.status === "USER_APPROVED");

	const handleGenerate = () => {
		generatePlan.mutate(session.id);
	};

	const handleApprove = () => {
		approvePlan.mutate(session.id);
	};

	const handleReject = () => {
		rejectPlan.mutate(session.id);
	};

	const handleStartEdit = () => {
		setEditedContent(planContentToMarkdown(plan?.content));
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		editPlan.mutate(
			{ sessionId: session.id, content: editedContent },
			{
				onSuccess: () => setIsEditing(false),
			},
		);
	};

	const statusLabel = (status: string) => {
		switch (status) {
			case "DRAFT":
				return "Generating...";
			case "CRITIC_REVIEWING":
				return "Critic reviewing...";
			case "CRITIC_APPROVED":
				return "Ready for review";
			case "USER_APPROVED":
				return "Approved";
			case "REJECTED":
				return "Rejected";
			default:
				return status;
		}
	};

	const statusColor = (status: string) => {
		switch (status) {
			case "DRAFT":
			case "CRITIC_REVIEWING":
				return "bg-amber-500/20 text-amber-400";
			case "CRITIC_APPROVED":
				return "bg-blue-500/20 text-blue-400";
			case "USER_APPROVED":
				return "bg-green-500/20 text-green-400";
			case "REJECTED":
				return "bg-red-500/20 text-red-400";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-lg">Content Plan</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Generate and review the content plan before proceeding.
				</p>
			</div>

			{(isInProgress || generatePlan.isPending || planLoading) && !isReady && (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						<p className="text-muted-foreground text-sm">
							Generating plan... This may take a moment.
						</p>
					</CardContent>
				</Card>
			)}

			{!hasPlan && !planLoading && !generatePlan.isPending && (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<p className="text-muted-foreground text-sm">
							No plan generated yet. Click below to create one.
						</p>
						<Button onClick={handleGenerate} disabled={generatePlan.isPending}>
							Generate Plan
						</Button>
					</CardContent>
				</Card>
			)}

			{hasPlan && !isEditing && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Plan v{plan.version}</CardTitle>
							<div className="flex items-center gap-2">
								{isInProgress && (
									<div className="size-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
								)}
								<span
									className={`rounded-sm px-1.5 py-0.5 text-[10px] ${statusColor(plan.status)}`}
								>
									{statusLabel(plan.status)}
								</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<SessionEditor
							content={planContentToMarkdown(plan.content)}
							editable={false}
							markdown
						/>
					</CardContent>
				</Card>
			)}

			{hasPlan && !isEditing && (
				<CriticFeedbackPanel
					criticFeedback={plan.criticFeedback}
					criticIterations={plan.criticIterations}
				/>
			)}

			{hasPlan && isEditing && (
				<Card>
					<CardHeader>
						<CardTitle>Edit Plan</CardTitle>
					</CardHeader>
					<CardContent>
						<SessionEditor
							content={editedContent}
							onChange={setEditedContent}
							editable={true}
							markdown
						/>
						<div className="mt-3 flex justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(false)}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSaveEdit}
								disabled={editPlan.isPending}
							>
								{editPlan.isPending ? "Saving..." : "Save"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{hasPlan && !isEditing && !isInProgress && !isReady && (
				<div className="flex justify-end gap-2">
					<Button variant="outline" size="sm" onClick={handleReject}>
						Reject
					</Button>
					<Button variant="outline" size="sm" onClick={handleStartEdit}>
						Edit
					</Button>
				</div>
			)}

			{hasPlan &&
				!isEditing &&
				(isReady || plan.status === "CRITIC_APPROVED") && (
					<div className="flex justify-end gap-2">
						<Button variant="outline" size="sm" onClick={handleReject}>
							Reject
						</Button>
						<Button variant="outline" size="sm" onClick={handleStartEdit}>
							Edit
						</Button>
						<Button
							size="sm"
							onClick={handleApprove}
							disabled={approvePlan.isPending}
						>
							{approvePlan.isPending ? "Approving..." : "Approve"}
						</Button>
					</div>
				)}
		</div>
	);
}

// ============================================================================
// Stage: Outline
// ============================================================================

function OutlineStage({ session }: { session: Session }) {
	const {
		data: outline,
		isLoading: outlineLoading,
		error: outlineError,
	} = useOutline(session.id, {
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === "DRAFT" || status === "CRITIC_REVIEWING") return 3000;
			return false;
		},
	});
	const generateOutline = useGenerateOutline();
	const approveOutline = useApproveOutline();
	const editOutline = useEditOutline();
	const goBack = useGoBack();
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState("");

	const hasOutline = outline && !outlineError;
	const isInProgress =
		hasOutline &&
		(outline.status === "DRAFT" || outline.status === "CRITIC_REVIEWING");
	const isReady =
		hasOutline &&
		(outline.status === "CRITIC_APPROVED" ||
			outline.status === "USER_APPROVED");

	const handleGenerate = () => {
		generateOutline.mutate(session.id);
	};

	const handleApprove = () => {
		approveOutline.mutate(session.id);
	};

	const handleReject = () => {
		goBack.mutate(session.id);
	};

	const handleStartEdit = () => {
		setEditedContent(outlineContentToMarkdown(outline?.content));
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		editOutline.mutate(
			{ sessionId: session.id, content: editedContent },
			{
				onSuccess: () => setIsEditing(false),
			},
		);
	};

	const statusLabel = (status: string) => {
		switch (status) {
			case "DRAFT":
				return "Generating...";
			case "CRITIC_REVIEWING":
				return "Critic reviewing...";
			case "CRITIC_APPROVED":
				return "Ready for review";
			case "USER_APPROVED":
				return "Approved";
			case "REJECTED":
				return "Rejected";
			default:
				return status;
		}
	};

	const statusColor = (status: string) => {
		switch (status) {
			case "DRAFT":
			case "CRITIC_REVIEWING":
				return "bg-amber-500/20 text-amber-400";
			case "CRITIC_APPROVED":
				return "bg-blue-500/20 text-blue-400";
			case "USER_APPROVED":
				return "bg-green-500/20 text-green-400";
			case "REJECTED":
				return "bg-red-500/20 text-red-400";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-lg">Content Outline</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Generate and review the content outline before final generation.
				</p>
			</div>

			{(isInProgress || generateOutline.isPending || outlineLoading) &&
				!isReady && (
					<Card>
						<CardContent className="flex flex-col items-center gap-4 py-12">
							<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="text-muted-foreground text-sm">
								Generating outline... This may take a moment.
							</p>
						</CardContent>
					</Card>
				)}

			{!hasOutline && !outlineLoading && !generateOutline.isPending && (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<p className="text-muted-foreground text-sm">
							No outline generated yet. Click below to create one.
						</p>
						<Button
							onClick={handleGenerate}
							disabled={generateOutline.isPending}
						>
							Generate Outline
						</Button>
					</CardContent>
				</Card>
			)}

			{hasOutline && !isEditing && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Outline v{outline.version}</CardTitle>
							<div className="flex items-center gap-2">
								{isInProgress && (
									<div className="size-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
								)}
								<span
									className={`rounded-sm px-1.5 py-0.5 text-[10px] ${statusColor(outline.status)}`}
								>
									{statusLabel(outline.status)}
								</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<SessionEditor
							content={outlineContentToMarkdown(outline.content)}
							editable={false}
							markdown
						/>
					</CardContent>
				</Card>
			)}

			{hasOutline && !isEditing && (
				<CriticFeedbackPanel
					criticFeedback={outline.criticFeedback}
					criticIterations={outline.criticIterations}
				/>
			)}

			{hasOutline && isEditing && (
				<Card>
					<CardHeader>
						<CardTitle>Edit Outline</CardTitle>
					</CardHeader>
					<CardContent>
						<SessionEditor
							content={editedContent}
							onChange={setEditedContent}
							editable={true}
							markdown
						/>
						<div className="mt-3 flex justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(false)}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSaveEdit}
								disabled={editOutline.isPending}
							>
								{editOutline.isPending ? "Saving..." : "Save"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{hasOutline && !isEditing && !isInProgress && !isReady && (
				<div className="flex justify-end gap-2">
					<Button variant="outline" size="sm" onClick={handleReject}>
						Reject
					</Button>
					<Button variant="outline" size="sm" onClick={handleStartEdit}>
						Edit
					</Button>
				</div>
			)}

			{hasOutline &&
				!isEditing &&
				(isReady || outline.status === "CRITIC_APPROVED") && (
					<div className="flex justify-end gap-2">
						<Button variant="outline" size="sm" onClick={handleReject}>
							Reject
						</Button>
						<Button variant="outline" size="sm" onClick={handleStartEdit}>
							Edit
						</Button>
						<Button
							size="sm"
							onClick={handleApprove}
							disabled={approveOutline.isPending}
						>
							{approveOutline.isPending ? "Approving..." : "Approve"}
						</Button>
					</div>
				)}
		</div>
	);
}

// ============================================================================
// Stage: Generation
// ============================================================================

function GenerationStage({ session }: { session: Session }) {
	const {
		data: content,
		isLoading: contentLoading,
		error: contentError,
	} = useContent(session.id, {
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === "DRAFT" || status === "CRITIC_REVIEWING") return 3000;
			return false;
		},
	});
	const generateContent = useGenerateContent();
	const approveContent = useApproveContent();
	const editContent = useEditContent();
	const goBack = useGoBack();
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState("");

	const hasContent = content && !contentError;
	const isInProgress =
		hasContent &&
		(content.status === "DRAFT" || content.status === "CRITIC_REVIEWING");
	const isReady =
		hasContent &&
		(content.status === "CRITIC_APPROVED" ||
			content.status === "USER_APPROVED");

	const handleGenerate = () => {
		generateContent.mutate(session.id);
	};

	const handleApprove = () => {
		approveContent.mutate(session.id);
	};

	const handleReject = () => {
		goBack.mutate(session.id);
	};

	const handleStartEdit = () => {
		setEditedContent(content?.content ?? "");
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		editContent.mutate(
			{ sessionId: session.id, content: editedContent },
			{
				onSuccess: () => setIsEditing(false),
			},
		);
	};

	const handleExport = async () => {
		try {
			const markdown = await sessionsApi.exportMarkdown(session.id);
			const blob = new Blob([markdown], { type: "text/markdown" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${session.title.replace(/\s+/g, "-").toLowerCase()}.md`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Export failed:", error);
		}
	};

	const statusLabel = (status: string) => {
		switch (status) {
			case "DRAFT":
				return "Generating...";
			case "CRITIC_REVIEWING":
				return "Critic reviewing...";
			case "CRITIC_APPROVED":
				return "Ready for review";
			case "USER_APPROVED":
				return "Approved";
			case "REJECTED":
				return "Rejected";
			default:
				return status;
		}
	};

	const statusColor = (status: string) => {
		switch (status) {
			case "DRAFT":
			case "CRITIC_REVIEWING":
				return "bg-amber-500/20 text-amber-400";
			case "CRITIC_APPROVED":
				return "bg-blue-500/20 text-blue-400";
			case "USER_APPROVED":
				return "bg-green-500/20 text-green-400";
			case "REJECTED":
				return "bg-red-500/20 text-red-400";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-lg">Generated Content</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Generate the final content. Review, approve, and export when ready.
				</p>
			</div>

			{(isInProgress || generateContent.isPending || contentLoading) &&
				!isReady && (
					<Card>
						<CardContent className="flex flex-col items-center gap-4 py-12">
							<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="text-muted-foreground text-sm">
								Generating content... This may take a moment.
							</p>
						</CardContent>
					</Card>
				)}

			{!hasContent && !contentLoading && !generateContent.isPending && (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<p className="text-muted-foreground text-sm">
							No content generated yet. Click below to generate it.
						</p>
						<Button
							onClick={handleGenerate}
							disabled={generateContent.isPending}
						>
							Generate Content
						</Button>
					</CardContent>
				</Card>
			)}

			{hasContent && !isEditing && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Content v{content.version}</CardTitle>
							<div className="flex items-center gap-2">
								{isInProgress && (
									<div className="size-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
								)}
								<span
									className={`rounded-sm px-1.5 py-0.5 text-[10px] ${statusColor(content.status)}`}
								>
									{statusLabel(content.status)}
								</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<SessionEditor
							content={content.content}
							editable={false}
							markdown
						/>
					</CardContent>
				</Card>
			)}

			{hasContent && !isEditing && (
				<CriticFeedbackPanel
					criticFeedback={content.criticFeedback}
					criticIterations={content.criticIterations}
				/>
			)}

			{hasContent && isEditing && (
				<Card>
					<CardHeader>
						<CardTitle>Edit Content</CardTitle>
					</CardHeader>
					<CardContent>
						<SessionEditor
							content={editedContent}
							onChange={setEditedContent}
							editable={true}
							markdown
						/>
						<div className="mt-3 flex justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(false)}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSaveEdit}
								disabled={editContent.isPending}
							>
								{editContent.isPending ? "Saving..." : "Save"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{hasContent && !isEditing && !isInProgress && !isReady && (
				<div className="flex justify-end gap-2">
					<Button variant="outline" size="sm" onClick={handleReject}>
						Reject
					</Button>
					<Button variant="outline" size="sm" onClick={handleStartEdit}>
						Edit
					</Button>
				</div>
			)}

			{hasContent &&
				!isEditing &&
				(isReady || content.status === "CRITIC_APPROVED") && (
					<div className="flex justify-end gap-2">
						<Button variant="outline" size="sm" onClick={handleExport}>
							Export Markdown
						</Button>
						<Button variant="outline" size="sm" onClick={handleReject}>
							Reject
						</Button>
						<Button variant="outline" size="sm" onClick={handleStartEdit}>
							Edit
						</Button>
						<Button
							size="sm"
							onClick={handleApprove}
							disabled={approveContent.isPending}
						>
							{approveContent.isPending ? "Approving..." : "Approve"}
						</Button>
					</div>
				)}
		</div>
	);
}

// ============================================================================
// Stage: Complete
// ============================================================================

function CompleteStage({ session }: { session: Session }) {
	const handleExport = async () => {
		try {
			const markdown = await sessionsApi.exportMarkdown(session.id);
			const blob = new Blob([markdown], { type: "text/markdown" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${session.title.replace(/\s+/g, "-").toLowerCase()}.md`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Export failed:", error);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-center gap-4 py-12 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-green-500/20">
					<span className="text-green-400 text-xl">{"\u2713"}</span>
				</div>
				<h2 className="font-semibold text-lg">Session Complete</h2>
				<p className="max-w-md text-muted-foreground text-sm">
					Your content has been generated and approved. You can export it as
					Markdown or start a new session.
				</p>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleExport}>
						Export Markdown
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Main Session Detail Page
// ============================================================================

function SessionDetailPage() {
	const { sessionId } = Route.useParams();
	const { data: session, isLoading, error } = useSession(sessionId);
	const goBack = useGoBack();

	const currentStage = session?.currentStage ?? "OUTPUT_SELECTION";
	const currentStageIndex = STAGES.indexOf(
		currentStage as (typeof STAGES)[number],
	);
	const [viewingStage, setViewingStage] = useState(currentStage);

	// Keep viewingStage in sync when currentStage changes (e.g., after advancing)
	useEffect(() => {
		setViewingStage(currentStage);
	}, [currentStage]);

	const isViewingPast = viewingStage !== currentStage;

	const handleBack = () => {
		goBack.mutate(sessionId);
	};

	if (isLoading) {
		return (
			<div className="flex h-full flex-col">
				<div className="border-border border-b px-4 py-2">
					<Skeleton className="h-6 w-64" />
				</div>
				<div className="flex-1 p-6">
					<div className="space-y-4">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-96" />
						<div className="grid grid-cols-3 gap-4 pt-4">
							<Skeleton className="h-24" />
							<Skeleton className="h-24" />
							<Skeleton className="h-24" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || !session) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="font-semibold text-lg">Session Not Found</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						{error?.message ?? "The session could not be loaded."}
					</p>
				</div>
			</div>
		);
	}

	const renderReadOnlyStage = () => {
		switch (viewingStage) {
			case "OUTPUT_SELECTION":
				return <ReadOnlyOutputSelection session={session} />;
			case "CLARIFYING":
				return <ReadOnlyClarifying session={session} />;
			case "PERSONA":
				return <ReadOnlyPersona session={session} />;
			case "PLAN":
				return <ReadOnlyPlan session={session} />;
			case "OUTLINE":
				return <ReadOnlyOutline session={session} />;
			case "GENERATION":
				return <ReadOnlyGeneration session={session} />;
			default:
				return null;
		}
	};

	const renderStage = () => {
		switch (currentStage) {
			case "OUTPUT_SELECTION":
				return <OutputSelectionStage session={session} />;
			case "CLARIFYING":
				return <ClarifyingStage session={session} />;
			case "PERSONA":
				return <PersonaStage session={session} />;
			case "PLAN":
				return <PlanStage session={session} />;
			case "OUTLINE":
				return <OutlineStage session={session} />;
			case "GENERATION":
				return <GenerationStage session={session} />;
			case "COMPLETE":
				return <CompleteStage session={session} />;
			default:
				return (
					<div className="text-center text-muted-foreground">
						Unknown stage: {currentStage}
					</div>
				);
		}
	};

	return (
		<div className="flex h-full flex-col">
			<StageStepper
				currentStage={currentStage}
				viewingStage={viewingStage}
				onStageClick={setViewingStage}
			/>

			<div className="flex-1 overflow-y-auto p-6">
				{isViewingPast && (
					<div className="mb-4 flex items-center gap-2 border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-xs">
						Viewing completed stage
						<button
							type="button"
							onClick={() => setViewingStage(currentStage)}
							className="font-medium text-primary hover:underline"
						>
							Return to current
						</button>
					</div>
				)}

				{isViewingPast ? (
					renderReadOnlyStage()
				) : (
					<>
						{currentStageIndex > 0 && currentStage !== "COMPLETE" && (
							<div className="mb-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleBack}
									disabled={goBack.isPending}
								>
									{goBack.isPending ? "Going back..." : "\u2190 Back"}
								</Button>
							</div>
						)}

						{renderStage()}
					</>
				)}
			</div>
		</div>
	);
}
