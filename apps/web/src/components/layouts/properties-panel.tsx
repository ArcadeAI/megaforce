import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "./resize-handle";

interface PropertiesPanelProps {
	children?: React.ReactNode;
	className?: string;
	width: number;
	isCollapsed: boolean;
	onWidthChange: (width: number) => void;
	onToggleCollapse: () => void;
	minWidth?: number;
	maxWidth?: number;
}

export function PropertiesPanel({
	children,
	className,
	width,
	isCollapsed,
	onWidthChange,
	onToggleCollapse,
	minWidth = 250,
	maxWidth = 400,
}: PropertiesPanelProps) {
	const handleResize = (delta: number) => {
		// For right panel, negative delta increases width
		const newWidth = Math.max(minWidth, Math.min(maxWidth, width - delta));
		onWidthChange(newWidth);
	};

	return (
		<aside
			className={cn(
				"relative flex h-full border-border border-l bg-sidebar transition-all duration-200",
				isCollapsed && "w-0 overflow-hidden",
				className,
			)}
			style={{
				width: isCollapsed ? 0 : width,
			}}
			aria-label="Properties panel"
		>
			{/* Resize Handle */}
			{!isCollapsed && (
				<ResizeHandle
					onResize={handleResize}
					direction="horizontal"
					className="absolute top-0 left-0 z-10 h-full"
				/>
			)}

			{/* Panel Content */}
			<div className="flex h-full w-full flex-col overflow-hidden">
				{/* Header with collapse button */}
				<div className="flex h-12 items-center justify-between border-border border-b px-4">
					<span className="font-medium text-sidebar-foreground text-sm">
						Properties
					</span>
					<button
						type="button"
						onClick={onToggleCollapse}
						className="rounded-md p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
						aria-label="Collapse properties panel"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto p-4">{children}</div>
			</div>

			{/* Expand Button (shown when collapsed) */}
			{isCollapsed && (
				<button
					type="button"
					onClick={onToggleCollapse}
					className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-l-md border border-border border-r-0 bg-sidebar p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
					aria-label="Expand properties panel"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
			)}
		</aside>
	);
}
