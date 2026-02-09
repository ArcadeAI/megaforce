import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useScopedTabs, useTabs } from "@/contexts/tab-context";

import { Tab } from "./tab";

export function TabBar({ scope }: { scope?: string }) {
	const globalTabs = useTabs();
	const scopedTabs = useScopedTabs(scope ?? "");
	const { tabs, activeTabId, closeTab, switchTab, openTab, reorderTabs } = scope
		? scopedTabs
		: globalTabs;
	const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		tabId: string,
	) => {
		setDraggedTabId(tabId);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		targetTabId: string,
	) => {
		e.preventDefault();

		if (!draggedTabId || draggedTabId === targetTabId) {
			setDraggedTabId(null);
			return;
		}

		const fromIndex = tabs.findIndex((t) => t.id === draggedTabId);
		const toIndex = tabs.findIndex((t) => t.id === targetTabId);

		if (fromIndex !== -1 && toIndex !== -1) {
			reorderTabs(fromIndex, toIndex);
		}

		setDraggedTabId(null);
	};

	const handleNewTab = () => {
		openTab({ title: "Untitled" });
	};

	if (tabs.length === 0) {
		return (
			<div className="border-border bg-muted/30 flex h-9 items-center justify-between border-b px-2">
				<span className="text-muted-foreground text-sm">No tabs open</span>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleNewTab}
					aria-label="New tab"
				>
					<Plus />
				</Button>
			</div>
		);
	}

	return (
		<div className="border-border bg-muted/30 flex h-9 items-center border-b">
			{/* Tab list */}
			<div className="scrollbar-thin flex flex-1 overflow-x-auto">
				{tabs.map((tab) => (
					<Tab
						key={tab.id}
						tab={tab}
						isActive={tab.id === activeTabId}
						onClose={closeTab}
						onSelect={switchTab}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
					/>
				))}
			</div>

			{/* New tab button */}
			<div className="border-border flex shrink-0 items-center border-l px-1">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleNewTab}
					aria-label="New tab"
				>
					<Plus />
				</Button>
			</div>
		</div>
	);
}
