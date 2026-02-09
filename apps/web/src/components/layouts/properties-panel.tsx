import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { cn } from "@/lib/utils";

import { ResizeHandle } from "./resize-handle";

interface PropertiesPanelProperties {
	children?: React.ReactNode;
	className?: string;
	width: number;
	isCollapsed: boolean;
	onWidthChange: (width: number) => void;
	onToggleCollapse: () => void;
	minWidth?: number;
	maxWidth?: number;
}

const COLLAPSED_WIDTH = 40;

export function PropertiesPanel({
	children,
	className,
	width,
	isCollapsed,
	onWidthChange,
	onToggleCollapse,
	minWidth = 250,
	maxWidth = 400,
}: PropertiesPanelProperties) {
	const handleResize = (delta: number) => {
		// For right panel, negative delta increases width
		const newWidth = Math.max(minWidth, Math.min(maxWidth, width - delta));
		onWidthChange(newWidth);
	};

	return (
		<aside
			className={cn(
				"border-border bg-sidebar relative flex h-full flex-shrink-0 border-l transition-all duration-200",
				className,
			)}
			style={{
				width: isCollapsed ? COLLAPSED_WIDTH : width,
			}}
			aria-label="Properties panel"
		>
			{isCollapsed ? (
				// Collapsed state - thin bar with expand button at top
				<div className="flex h-full w-full flex-col">
					<div className="border-border flex h-12 items-center justify-center border-b">
						<button
							type="button"
							onClick={onToggleCollapse}
							className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-1.5 transition-colors"
							aria-label="Expand properties panel"
						>
							<PanelRightOpen className="h-4 w-4" />
						</button>
					</div>
				</div>
			) : (
				// Expanded state
				<>
					{/* Resize Handle */}
					<ResizeHandle
						onResize={handleResize}
						direction="horizontal"
						className="absolute top-0 left-0 z-10 h-full"
					/>

					{/* Panel Content */}
					<div className="flex h-full w-full flex-col overflow-hidden">
						{/* Header with collapse button */}
						<div className="border-border flex h-12 items-center justify-between border-b px-4">
							<span className="text-sidebar-foreground text-sm font-medium">
								Properties
							</span>
							<button
								type="button"
								onClick={onToggleCollapse}
								className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-1.5 transition-colors"
								aria-label="Collapse properties panel"
							>
								<PanelRightClose className="h-4 w-4" />
							</button>
						</div>

						{/* Content Area */}
						<div className="flex-1 overflow-y-auto p-4">{children}</div>
					</div>
				</>
			)}
		</aside>
	);
}
