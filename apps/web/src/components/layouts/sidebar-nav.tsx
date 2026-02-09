import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";

import { ResizeHandle } from "./resize-handle";

interface SidebarNavProperties {
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

export function SidebarNav({
	children,
	className,
	width,
	isCollapsed,
	onWidthChange,
	onToggleCollapse,
	minWidth = 200,
	maxWidth = 400,
}: SidebarNavProperties) {
	const handleResize = (delta: number) => {
		const newWidth = Math.max(minWidth, Math.min(maxWidth, width + delta));
		onWidthChange(newWidth);
	};

	return (
		<aside
			className={cn(
				"border-border bg-sidebar relative flex h-full flex-shrink-0 border-r transition-all duration-200",
				className,
			)}
			style={{
				width: isCollapsed ? COLLAPSED_WIDTH : width,
			}}
			aria-label="Sidebar navigation"
		>
			{isCollapsed ? (
				// Collapsed state - thin bar with expand button at top
				<div className="flex h-full w-full flex-col">
					<div className="border-border flex h-12 items-center justify-center border-b">
						<button
							type="button"
							onClick={onToggleCollapse}
							className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-1.5 transition-colors"
							aria-label="Expand sidebar"
						>
							<PanelLeftOpen className="h-4 w-4" />
						</button>
					</div>
				</div>
			) : (
				// Expanded state
				<>
					<div className="flex h-full w-full flex-col overflow-hidden">
						{/* Header with collapse button */}
						<div className="border-border flex h-12 items-center justify-between border-b px-4">
							<span className="text-sidebar-foreground text-sm font-medium">
								Navigation
							</span>
							<button
								type="button"
								onClick={onToggleCollapse}
								className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-1.5 transition-colors"
								aria-label="Collapse sidebar"
							>
								<PanelLeftClose className="h-4 w-4" />
							</button>
						</div>

						{/* Content Area */}
						<div className="flex-1 overflow-y-auto p-4">{children}</div>
					</div>

					{/* Resize Handle */}
					<ResizeHandle
						onResize={handleResize}
						direction="horizontal"
						className="absolute top-0 right-0 z-10 h-full"
					/>
				</>
			)}
		</aside>
	);
}
