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
import type { Persona } from "@/lib/api/personas";
import { authClient } from "@/lib/auth-client";
import {
	useCreatePersona,
	useDeletePersona,
	usePersonas,
} from "@/lib/hooks/use-personas";

export const Route = createFileRoute("/personas")({
	component: PersonasPage,
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

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatRelativeTime(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return formatDate(dateStr);
}

function PersonaSidebar() {
	const [searchQuery, setSearchQuery] = useState("");
	const { data: personas, isLoading } = usePersonas();
	const createPersona = useCreatePersona();
	const deletePersona = useDeletePersona();
	const { openTab, activeTabId } = useScopedTabs("persona-");
	const navigate = useNavigate();
	const [newName, setNewName] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [contextMenu, setContextMenu] = useState<{
		personaId: string;
		isDefault: boolean;
		x: number;
		y: number;
	} | null>(null);

	useEffect(() => {
		if (!contextMenu) return;
		const dismiss = () => setContextMenu(null);
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") dismiss();
		};
		document.addEventListener("click", dismiss);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("click", dismiss);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [contextMenu]);

	const filteredPersonas = personas?.filter((p) => {
		const matchesSearch =
			!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesSearch;
	});

	const handleCreatePersona = async () => {
		const name = newName.trim() || "Untitled Persona";
		setIsCreating(false);
		setNewName("");
		createPersona.mutate(
			{
				name,
				description: "",
				styleProfile: { tone: "neutral", formality: "neutral", humor: "none" },
				vocabularyLevel: "intermediate",
				perspective: "second-person",
				sentenceStyle: "balanced",
				sampleOutput: "",
			},
			{
				onSuccess: (persona) => {
					handleOpenPersona(persona);
				},
			},
		);
	};

	const handleOpenPersona = (persona: Persona) => {
		const tabId = `persona-${persona.id}`;
		openTab({
			id: tabId,
			title: persona.name,
			metadata: { personaId: persona.id },
		});
		navigate({
			to: "/personas/$personaId",
			params: { personaId: persona.id },
		});
	};

	const handleContextMenu = (
		e: React.MouseEvent,
		personaId: string,
		isDefault: boolean,
	) => {
		e.preventDefault();
		setContextMenu({ personaId, isDefault, x: e.clientX, y: e.clientY });
	};

	const handleDelete = (personaId: string) => {
		deletePersona.mutate(personaId);
		setContextMenu(null);
	};

	return (
		<div className="flex h-full flex-col gap-3">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">Personas</h3>
				<Button
					size="xs"
					variant="outline"
					onClick={() => setIsCreating(true)}
					disabled={createPersona.isPending}
				>
					+ New
				</Button>
			</div>

			<Input
				placeholder="Search personas..."
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="h-7 text-xs"
			/>

			{isCreating && (
				<div className="flex gap-1">
					<Input
						placeholder="Persona name..."
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleCreatePersona();
							if (e.key === "Escape") {
								setIsCreating(false);
								setNewName("");
							}
						}}
						autoFocus
						className="h-7 text-xs"
					/>
					<Button size="xs" onClick={handleCreatePersona}>
						Add
					</Button>
				</div>
			)}

			<div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
				{isLoading && (
					<div className="space-y-2">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
							<Skeleton key={`skeleton-${i}`} className="h-12 w-full" />
						))}
					</div>
				)}

				{filteredPersonas?.length === 0 && !isLoading && (
					<p className="py-4 text-center text-muted-foreground text-xs">
						{searchQuery
							? "No personas match your search."
							: "No personas yet. Create one to get started."}
					</p>
				)}

				{filteredPersonas?.map((persona) => {
					const tabId = `persona-${persona.id}`;
					const isActive = activeTabId === tabId;
					const tone = (persona.styleProfile as Record<string, string> | null)
						?.tone;

					return (
						<button
							key={persona.id}
							type="button"
							className={`w-full cursor-pointer rounded-none border p-2.5 text-left transition-colors ${
								isActive
									? "border-primary/50 bg-primary/10"
									: "border-transparent hover:bg-muted"
							}`}
							onClick={() => handleOpenPersona(persona)}
							onContextMenu={(e) =>
								handleContextMenu(e, persona.id, persona.isDefault)
							}
						>
							<div className="flex items-start justify-between gap-1">
								<span className="truncate font-medium text-xs">
									{persona.name}
								</span>
								{persona.isDefault && (
									<span className="shrink-0 rounded-sm bg-primary/20 px-1 py-0.5 text-[10px] text-primary">
										default
									</span>
								)}
							</div>
							<div className="mt-1 flex items-center gap-1.5">
								{tone && (
									<span className="inline-block rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
										{tone}
									</span>
								)}
								<span className="text-[10px] text-muted-foreground">
									{formatRelativeTime(persona.updatedAt)}
								</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Context menu */}
			{contextMenu && (
				<div
					className="fixed z-50 min-w-32 rounded-sm border border-border bg-popover p-1 shadow-md"
					style={{ top: contextMenu.y, left: contextMenu.x }}
				>
					<button
						type="button"
						className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
							contextMenu.isDefault
								? "cursor-not-allowed text-muted-foreground"
								: "text-red-500 hover:bg-muted"
						}`}
						onClick={() =>
							!contextMenu.isDefault && handleDelete(contextMenu.personaId)
						}
						disabled={contextMenu.isDefault}
					>
						{contextMenu.isDefault ? "Cannot delete default" : "Delete"}
					</button>
				</div>
			)}
		</div>
	);
}

function PersonaProperties() {
	const { activeTabId, tabs } = useScopedTabs("persona-");
	const activeTab = tabs.find((t) => t.id === activeTabId);
	const personaId = activeTab?.metadata?.personaId as string | undefined;

	if (!personaId) {
		return (
			<div className="p-2 text-muted-foreground text-xs">
				Select a persona to view properties.
			</div>
		);
	}

	return <PersonaPropertiesDetail personaId={personaId} />;
}

function PersonaPropertiesDetail({ personaId }: { personaId: string }) {
	const { data: personas, isLoading } = usePersonas();
	const persona = personas?.find((p) => p.id === personaId);

	if (isLoading) {
		return (
			<div className="space-y-3 p-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-28" />
			</div>
		);
	}

	if (!persona) {
		return (
			<div className="p-2 text-muted-foreground text-xs">
				Persona not found.
			</div>
		);
	}

	const style = (persona.styleProfile ?? {}) as Record<string, string>;

	return (
		<div className="space-y-4">
			<div className="space-y-3 rounded-none border border-border p-3">
				<h3 className="font-medium text-sm">Properties</h3>
				<div className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Name</span>
						<span className="truncate pl-2 text-right">{persona.name}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Default</span>
						<span>{persona.isDefault ? "Yes" : "No"}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Created</span>
						<span>{formatDate(persona.createdAt)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Updated</span>
						<span>{formatRelativeTime(persona.updatedAt)}</span>
					</div>
				</div>
			</div>

			<div className="space-y-3 rounded-none border border-border p-3">
				<h3 className="font-medium text-sm">Style</h3>
				<div className="space-y-2 text-xs">
					{style.tone && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tone</span>
							<span>{style.tone}</span>
						</div>
					)}
					{style.formality && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Formality</span>
							<span>{style.formality}</span>
						</div>
					)}
					{style.humor && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Humor</span>
							<span>{style.humor}</span>
						</div>
					)}
					{persona.vocabularyLevel && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Vocabulary</span>
							<span>{persona.vocabularyLevel}</span>
						</div>
					)}
					{persona.perspective && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Perspective</span>
							<span>{persona.perspective}</span>
						</div>
					)}
					{persona.sentenceStyle && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Sentence Style</span>
							<span>{persona.sentenceStyle}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function MainContent() {
	const matches = useMatches();
	const isIndexRoute = matches[matches.length - 1]?.id === "/personas";

	if (!isIndexRoute) {
		return <Outlet />;
	}

	return (
		<div className="flex h-full items-center justify-center">
			<div className="max-w-md space-y-4 text-center">
				<h2 className="font-semibold text-lg">Personas</h2>
				<p className="text-muted-foreground text-sm">
					Personas define the voice and style of your generated content. Create
					a new persona or select an existing one from the sidebar to customize
					its attributes.
				</p>
				<div className="space-y-2 text-left text-muted-foreground text-xs">
					<p className="font-medium text-foreground">Each persona controls:</p>
					<ul className="list-inside list-disc space-y-1">
						<li>Writing tone (friendly, authoritative, conversational...)</li>
						<li>Formality level (casual to formal)</li>
						<li>Humor (none to heavy)</li>
						<li>Vocabulary level and perspective</li>
						<li>Sentence style</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

function PersonasPage() {
	const { activeTabId, tabs } = useScopedTabs("persona-");
	const navigate = useNavigate();

	useEffect(() => {
		if (!activeTabId) {
			navigate({ to: "/personas" });
			return;
		}

		const activeTab = tabs.find((t) => t.id === activeTabId);
		const tabPersonaId = activeTab?.metadata?.personaId as string | undefined;

		if (tabPersonaId) {
			navigate({
				to: "/personas/$personaId",
				params: { personaId: tabPersonaId },
			});
		} else {
			navigate({ to: "/personas" });
		}
	}, [activeTabId, tabs, navigate]);

	return (
		<AppLayout
			scope="persona-"
			sidebarContent={<PersonaSidebar />}
			mainContent={<MainContent />}
			propertiesContent={<PersonaProperties />}
		/>
	);
}
