import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Tab as TabType } from "@/contexts/tab-context";
import { cn } from "@/lib/utils";

interface TabProperties {
	tab: TabType;
	isActive: boolean;
	onClose: (tabId: string) => void;
	onSelect: (tabId: string) => void;
	onDragStart?: (e: React.DragEvent<HTMLDivElement>, tabId: string) => void;
	onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
	onDrop?: (e: React.DragEvent<HTMLDivElement>, tabId: string) => void;
}

export function Tab({
	tab,
	isActive,
	onClose,
	onSelect,
	onDragStart,
	onDragOver,
	onDrop,
}: TabProperties) {
	return (
		<div
			className={cn(
				"group border-border relative flex h-9 max-w-[200px] min-w-[120px] cursor-pointer items-center gap-2 border-r px-3 transition-colors",
				isActive
					? "bg-background text-foreground"
					: "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
			draggable
			onDragStart={(e) => onDragStart?.(e, tab.id)}
			onDragOver={onDragOver}
			onDrop={(e) => onDrop?.(e, tab.id)}
			onClick={() => {
				onSelect(tab.id);
			}}
			onAuxClick={(e) => {
				if (e.button === 1) {
					e.preventDefault();
					onClose(tab.id);
				}
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect(tab.id);
				}
			}}
			role="tab"
			tabIndex={0}
			aria-selected={isActive}
			aria-label={tab.title}
		>
			{/* Tab title */}
			<span className="flex-1 truncate text-sm">
				{tab.isDirty && <span className="mr-1 text-orange-500">•</span>}
				{tab.title}
			</span>

			{/* Close button */}
			<Button
				variant="ghost"
				size="icon-xs"
				className={cn(
					"hover:bg-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100",
					isActive && "opacity-100",
				)}
				onClick={(e) => {
					e.stopPropagation();
					onClose(tab.id);
				}}
				aria-label={`Close ${tab.title}`}
			>
				<X />
			</Button>

			{/* Active indicator */}
			{isActive && (
				<div className="bg-primary absolute inset-x-0 bottom-0 h-0.5" />
			)}
		</div>
	);
}
