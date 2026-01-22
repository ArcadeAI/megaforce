import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "./resize-handle";

interface SidebarNavProps {
	children?: React.ReactNode;
	className?: string;
	width: number;
	isCollapsed: boolean;
	onWidthChange: (width: number) => void;
	onToggleCollapse: () => void;
	minWidth?: number;
	maxWidth?: number;
}

export function SidebarNav({
	children,
	className,
	width,
	isCollapsed,
	onWidthChange,
	onToggleCollapse,
	minWidth = 200,
	maxWidth = 400,
}: SidebarNavProps) {
	const handleResize = (delta: number) => {
		const newWidth = Math.max(minWidth, Math.min(maxWidth, width + delta));
		onWidthChange(newWidth);
	};

	return (
		<aside
			className={cn(
				"relative flex h-full border-border border-r bg-sidebar transition-all duration-200",
				isCollapsed && "w-0 overflow-hidden",
				className,
			)}
			style={{
				width: isCollapsed ? 0 : width,
			}}
			aria-label="Sidebar navigation"
		>
			{/* Sidebar Content */}
			<div className="flex h-full w-full flex-col overflow-hidden">
				{/* Header with collapse button */}
				<div className="flex h-12 items-center justify-between border-border border-b px-4">
					<span className="font-medium text-sidebar-foreground text-sm">
						Navigation
					</span>
					<button
						type="button"
						onClick={onToggleCollapse}
						className="rounded-md p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
						aria-label="Collapse sidebar"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
				</div>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto p-4">{children}</div>
			</div>

			{/* Resize Handle */}
			{!isCollapsed && (
				<ResizeHandle
					onResize={handleResize}
					direction="horizontal"
					className="absolute top-0 right-0 z-10 h-full"
				/>
			)}

			{/* Expand Button (shown when collapsed) */}
			{isCollapsed && (
				<button
					type="button"
					onClick={onToggleCollapse}
					className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-r-md border border-border border-l-0 bg-sidebar p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
					aria-label="Expand sidebar"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			)}
		</aside>
	);
}
