import {
	createFileRoute,
	Outlet,
	redirect,
	useMatches,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useScopedTabs } from "@/contexts/tab-context";
import type { Session } from "@/lib/api/sessions";
import { authClient } from "@/lib/auth-client";
import {
	useArchiveSession,
	useCreateSession,
	useDuplicateSession,
	useSession,
	useSessions,
	useUnarchiveSession,
} from "@/lib/hooks/use-sessions";

export const Route = createFileRoute("/sessions")({
	component: SessionsPage,
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

const STAGE_LABELS: Record<string, string> = {
	OUTPUT_SELECTION: "Output Selection",
	CLARIFYING: "Clarifying",
	PERSONA: "Persona",
	PLAN: "Plan",
	OUTLINE: "Outline",
	GENERATION: "Generation",
	COMPLETE: "Complete",
};

const STAGE_COLORS: Record<string, string> = {
	OUTPUT_SELECTION: "bg-blue-500/20 text-blue-400",
	CLARIFYING: "bg-amber-500/20 text-amber-400",
	PERSONA: "bg-purple-500/20 text-purple-400",
	PLAN: "bg-cyan-500/20 text-cyan-400",
	OUTLINE: "bg-emerald-500/20 text-emerald-400",
	GENERATION: "bg-orange-500/20 text-orange-400",
	COMPLETE: "bg-green-500/20 text-green-400",
};

const STATUS_COLORS: Record<string, string> = {
	ACTIVE: "text-green-400",
	PAUSED: "text-yellow-400",
	COMPLETED: "text-blue-400",
	ARCHIVED: "text-muted-foreground",
};

const STAGE_ORDER = [
	"OUTPUT_SELECTION",
	"CLARIFYING",
	"PERSONA",
	"PLAN",
	"OUTLINE",
	"GENERATION",
	"COMPLETE",
] as const;

const OUTPUT_TYPE_LABELS: Record<string, string> = {
	BLOG_POST: "Blog Post",
	ARTICLE: "Article",
	SOCIAL_MEDIA: "Social Media",
	TECHNICAL_DOCS: "Technical Docs",
	MARKETING_COPY: "Marketing Copy",
	CUSTOM: "Custom",
};

const DATA_SOURCE_LABELS: Record<string, string> = {
	CORPUS_ONLY: "Corpus Only",
	DEEP_RESEARCH: "Deep Research",
	BOTH: "Both",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draft",
	CRITIC_REVIEWING: "Reviewing",
	CRITIC_APPROVED: "Approved",
	APPROVED: "Approved",
	REJECTED: "Rejected",
};

function stageIndex(stage: string): number {
	return STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffMins < 1) {
		return "just now";
	}
	if (diffMins < 60) {
		return `${diffMins}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}
	return formatDate(dateString);
}

function SessionSidebar() {
	const [searchQuery, setSearchQuery] = useState("");
	const { data: sessions, isLoading } = useSessions();
	const createSession = useCreateSession();
	const duplicateSession = useDuplicateSession();
	const archiveSession = useArchiveSession();
	const unarchiveSession = useUnarchiveSession();
	const { openTab, activeTabId } = useScopedTabs("session-");
	const navigate = useNavigate();
	const [newTitle, setNewTitle] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [showArchived, setShowArchived] = useState(false);
	const [contextMenu, setContextMenu] = useState<{
		sessionId: string;
		x: number;
		y: number;
	} | null>(null);

	useEffect(() => {
		if (!contextMenu) {
			return;
		}
		const dismiss = () => {
			setContextMenu(null);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				dismiss();
			}
		};
		document.addEventListener("click", dismiss);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("click", dismiss);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [contextMenu]);

	const filteredSessions = sessions?.filter((s) => {
		const matchesSearch =
			!searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesArchived = showArchived || s.status !== "ARCHIVED";
		return matchesSearch && matchesArchived;
	});

	const handleCreateSession = async () => {
		const title = newTitle.trim() || "Untitled Session";
		setIsCreating(false);
		setNewTitle("");
		createSession.mutate(
			{ title },
			{
				onSuccess: (session) => {
					handleOpenSession(session);
				},
			},
		);
	};

	const handleOpenSession = (session: Session) => {
		const tabId = `session-${session.id}`;
		openTab({
			id: tabId,
			title: session.title,
			metadata: { sessionId: session.id },
		});
		navigate({
			to: "/sessions/$sessionId",
			params: { sessionId: session.id },
		});
	};

	const handleContextMenu = (e: React.MouseEvent, sessionId: string) => {
		e.preventDefault();
		setContextMenu({ sessionId, x: e.clientX, y: e.clientY });
	};

	const handleDuplicate = (sessionId: string) => {
		duplicateSession.mutate(sessionId, {
			onSuccess: (newSession) => {
				handleOpenSession(newSession);
			},
		});
		setContextMenu(null);
	};

	const handleArchive = (sessionId: string) => {
		archiveSession.mutate(sessionId);
		setContextMenu(null);
	};

	const handleUnarchive = (sessionId: string) => {
		unarchiveSession.mutate(sessionId);
		setContextMenu(null);
	};

	return (
		<div className="flex h-full flex-col gap-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">Sessions</h3>
				<Button
					size="xs"
					variant="outline"
					onClick={() => {
						setIsCreating(true);
					}}
					disabled={createSession.isPending}
				>
					+ New
				</Button>
			</div>

			<Input
				placeholder="Search sessions..."
				value={searchQuery}
				onChange={(e) => {
					setSearchQuery(e.target.value);
				}}
				className="h-7 text-xs"
			/>

			{isCreating && (
				<div className="flex gap-1">
					<Input
						placeholder="Session title..."
						value={newTitle}
						onChange={(e) => {
							setNewTitle(e.target.value);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleCreateSession();
							}
							if (e.key === "Escape") {
								setIsCreating(false);
								setNewTitle("");
							}
						}}
						autoFocus
						className="h-7 text-xs"
					/>
					<Button size="xs" onClick={handleCreateSession}>
						Add
					</Button>
				</div>
			)}

			<div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
				{isLoading && (
					<div className="space-y-2">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
							<Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
						))}
					</div>
				)}

				{filteredSessions?.length === 0 && !isLoading && (
					<p className="text-muted-foreground py-4 text-center text-xs">
						{searchQuery
							? "No sessions match your search."
							: "No sessions yet. Create one to get started."}
					</p>
				)}

				{filteredSessions?.map((session) => {
					const tabId = `session-${session.id}`;
					const isActive = activeTabId === tabId;

					return (
						<button
							key={session.id}
							type="button"
							className={`w-full cursor-pointer rounded-none border p-2.5 text-left transition-colors ${
								isActive
									? "border-primary/50 bg-primary/10"
									: "hover:bg-muted border-transparent"
							} ${session.status === "ARCHIVED" ? "opacity-60" : ""}`}
							onClick={() => {
								handleOpenSession(session);
							}}
							onContextMenu={(e) => {
								handleContextMenu(e, session.id);
							}}
						>
							<div className="flex items-start justify-between gap-1">
								<span className="truncate text-xs font-medium">
									{session.title}
								</span>
								<span
									className={`shrink-0 text-[10px] ${STATUS_COLORS[session.status] ?? "text-muted-foreground"}`}
								>
									{session.status.toLowerCase()}
								</span>
							</div>
							<div className="mt-1 flex items-center gap-1.5">
								<span
									className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] ${STAGE_COLORS[session.currentStage] ?? "bg-muted text-muted-foreground"}`}
								>
									{STAGE_LABELS[session.currentStage] ?? session.currentStage}
								</span>
								<span className="text-muted-foreground text-[10px]">
									{formatRelativeTime(session.updatedAt)}
								</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Show archived toggle */}
			{sessions?.some((s) => s.status === "ARCHIVED") && (
				<button
					type="button"
					className="text-muted-foreground hover:text-foreground text-center text-xs"
					onClick={() => {
						setShowArchived((prev) => !prev);
					}}
				>
					{showArchived ? "Hide archived" : "Show archived"}
				</button>
			)}

			{/* Context menu */}
			{contextMenu && (
				<div
					className="border-border bg-popover fixed z-50 min-w-32 rounded-sm border p-1 shadow-md"
					style={{ top: contextMenu.y, left: contextMenu.x }}
				>
					<button
						type="button"
						className="hover:bg-muted w-full rounded-sm px-2 py-1 text-left text-xs"
						onClick={() => {
							handleDuplicate(contextMenu.sessionId);
						}}
					>
						Duplicate
					</button>
					{sessions?.find((s) => s.id === contextMenu.sessionId)?.status ===
					"ARCHIVED" ? (
						<button
							type="button"
							className="hover:bg-muted w-full rounded-sm px-2 py-1 text-left text-xs"
							onClick={() => {
								handleUnarchive(contextMenu.sessionId);
							}}
						>
							Unarchive
						</button>
					) : (
						<button
							type="button"
							className="hover:bg-muted w-full rounded-sm px-2 py-1 text-left text-xs"
							onClick={() => {
								handleArchive(contextMenu.sessionId);
							}}
						>
							Archive
						</button>
					)}
				</div>
			)}
		</div>
	);
}

function SessionProperties() {
	const { activeTabId, tabs } = useScopedTabs("session-");
	const activeTab = tabs.find((t) => t.id === activeTabId);
	const sessionId = activeTab?.metadata?.sessionId as string | undefined;

	if (!sessionId) {
		return (
			<div className="text-muted-foreground p-2 text-xs">
				Select a session to view properties.
			</div>
		);
	}

	return <SessionPropertiesDetail sessionId={sessionId} />;
}

function PropertyRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex justify-between">
			<span className="text-muted-foreground">{label}</span>
			<span className="truncate pl-2 text-right">{children}</span>
		</div>
	);
}

function PropertySection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="border-border space-y-2 border p-3">
			<h3 className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
				{title}
			</h3>
			{children}
		</div>
	);
}

function SessionPropertiesDetail({ sessionId }: { sessionId: string }) {
	const { data: s, isLoading } = useSession(sessionId);

	if (isLoading) {
		return (
			<div className="space-y-3 p-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-28" />
			</div>
		);
	}

	if (!s) {
		return (
			<div className="text-muted-foreground p-2 text-xs">
				Session not found.
			</div>
		);
	}

	const index = stageIndex(s.currentStage);
	const clarifying = s.clarifyingAnswers as Record<string, string> | null;
	const personas = s.sessionPersonas;
	const latestPlan = s.plans?.[0];
	const latestOutline = s.outlines?.[0];
	const latestContent = s.generatedContent?.[0];
	const metrics = latestContent?.metrics as Record<string, number> | null;

	return (
		<div className="space-y-4">
			{/* Properties */}
			<div className="border-border space-y-3 rounded-none border p-3">
				<h3 className="text-sm font-medium">Properties</h3>
				<div className="space-y-2 text-xs">
					<PropertyRow label="Title">{s.title}</PropertyRow>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Stage</span>
						<span
							className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] ${STAGE_COLORS[s.currentStage] ?? "bg-muted text-muted-foreground"}`}
						>
							{STAGE_LABELS[s.currentStage] ?? s.currentStage}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Status</span>
						<span
							className={STATUS_COLORS[s.status] ?? "text-muted-foreground"}
						>
							{s.status.toLowerCase()}
						</span>
					</div>
					<PropertyRow label="Created">{formatDate(s.createdAt)}</PropertyRow>
					<PropertyRow label="Updated">
						{formatRelativeTime(s.updatedAt)}
					</PropertyRow>
				</div>
			</div>

			{/* Output Types — shown after OUTPUT_SELECTION */}
			{index > 0 && s.outputTypes?.length ? (
				<PropertySection title="Output">
					<div className="flex flex-wrap gap-1">
						{s.outputTypes.map((type) => (
							<span
								key={type}
								className="rounded-sm bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400"
							>
								{OUTPUT_TYPE_LABELS[type] ?? type}
							</span>
						))}
					</div>
				</PropertySection>
			) : null}

			{/* Brief — shown after CLARIFYING */}
			{index > 1 && clarifying ? (
				<PropertySection title="Brief">
					<div className="space-y-1.5 text-xs">
						{clarifying.tone ? (
							<PropertyRow label="Tone">{clarifying.tone}</PropertyRow>
						) : null}
						{clarifying.audience ? (
							<PropertyRow label="Audience">{clarifying.audience}</PropertyRow>
						) : null}
						{clarifying.keywords ? (
							<PropertyRow label="Keywords">{clarifying.keywords}</PropertyRow>
						) : null}
						<PropertyRow label="Research">
							{DATA_SOURCE_LABELS[s.dataSourceMode] ?? s.dataSourceMode}
						</PropertyRow>
					</div>
				</PropertySection>
			) : null}

			{/* Persona — shown after PERSONA */}
			{index > 2 && personas?.length ? (
				<PropertySection title="Persona">
					<div className="space-y-1 text-xs">
						{personas.map((sp) => (
							<div key={sp.id} className="flex justify-between">
								<span>{sp.persona.name}</span>
								<span className="text-muted-foreground lowercase">
									{sp.role}
								</span>
							</div>
						))}
					</div>
				</PropertySection>
			) : null}

			{/* Plan — shown after PLAN */}
			{index > 3 && latestPlan ? (
				<PropertySection title="Plan">
					<p className="text-muted-foreground text-xs">
						v{latestPlan.version} &middot;{" "}
						{REVIEW_STATUS_LABELS[latestPlan.status] ?? latestPlan.status}{" "}
						&middot; {latestPlan.criticIterations} critic{" "}
						{latestPlan.criticIterations === 1 ? "round" : "rounds"}
					</p>
				</PropertySection>
			) : null}

			{/* Outline — shown after OUTLINE */}
			{index > 4 && latestOutline ? (
				<PropertySection title="Outline">
					<p className="text-muted-foreground text-xs">
						v{latestOutline.version} &middot;{" "}
						{REVIEW_STATUS_LABELS[latestOutline.status] ?? latestOutline.status}{" "}
						&middot; {latestOutline.criticIterations} critic{" "}
						{latestOutline.criticIterations === 1 ? "round" : "rounds"}
					</p>
				</PropertySection>
			) : null}

			{/* Content — shown after GENERATION */}
			{index > 5 && latestContent ? (
				<PropertySection title="Content">
					<p className="text-muted-foreground text-xs">
						v{latestContent.version} &middot;{" "}
						{REVIEW_STATUS_LABELS[latestContent.status] ?? latestContent.status}
						{metrics?.wordCount
							? ` \u00B7 ${metrics.wordCount.toLocaleString()} words`
							: ""}
						{metrics?.readingTime
							? ` \u00B7 ${metrics.readingTime} min read`
							: ""}
					</p>
				</PropertySection>
			) : null}
		</div>
	);
}

function MainContent() {
	const matches = useMatches();
	const isIndexRoute = matches.at(-1)?.id === "/sessions";

	if (!isIndexRoute) {
		return <Outlet />;
	}

	return (
		<div className="flex h-full items-center justify-center">
			<div className="max-w-md space-y-4 text-center">
				<h2 className="text-lg font-semibold">Welcome to Megaforce</h2>
				<p className="text-muted-foreground text-sm">
					Create a new session or select an existing one from the sidebar to
					begin generating content. Each session guides you through a multi-step
					workflow from output selection to final content generation.
				</p>
				<div className="text-muted-foreground space-y-2 text-left text-xs">
					<p className="text-foreground font-medium">Workflow stages:</p>
					<ol className="list-inside list-decimal space-y-1">
						<li>Choose output types (blog, article, social, etc.)</li>
						<li>Provide clarifying details (tone, audience, keywords)</li>
						<li>Select a writing persona</li>
						<li>Generate and review a content plan</li>
						<li>Generate and review an outline</li>
						<li>Generate final content</li>
					</ol>
				</div>
			</div>
		</div>
	);
}

function SessionsPage() {
	const { activeTabId, tabs } = useScopedTabs("session-");
	const navigate = useNavigate();

	// Sync tab state → URL. Always navigate based on what the active tab says.
	// TanStack Router no-ops if the URL is already correct.
	useEffect(() => {
		if (!activeTabId) {
			navigate({ to: "/sessions" });
			return;
		}

		const activeTab = tabs.find((t) => t.id === activeTabId);
		const tabSessionId = activeTab?.metadata?.sessionId as string | undefined;

		if (tabSessionId) {
			navigate({
				to: "/sessions/$sessionId",
				params: { sessionId: tabSessionId },
			});
		} else {
			navigate({ to: "/sessions" });
		}
	}, [activeTabId, tabs, navigate]);

	return (
		<AppLayout
			scope="session-"
			sidebarContent={<SessionSidebar />}
			mainContent={<MainContent />}
			propertiesContent={<SessionProperties />}
		/>
	);
}
