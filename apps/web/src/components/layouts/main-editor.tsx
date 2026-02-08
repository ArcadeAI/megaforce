import { cn } from "@/lib/utils";
import { TabBar } from "./tab-bar";

interface MainEditorProps {
	children?: React.ReactNode;
	className?: string;
}

export function MainEditor({ children, className }: MainEditorProps) {
	return (
		<main
			className={cn(
				"flex min-w-0 flex-1 flex-col overflow-hidden bg-background",
				className,
			)}
			aria-label="Main content area"
		>
			{/* Tab Bar */}
			<TabBar />

			{/* Content Area - driven by routing via Outlet */}
			<div className="flex-1 overflow-y-auto p-4">{children}</div>
		</main>
	);
}
