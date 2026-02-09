import { cn } from "@/lib/utils";

import { TabBar } from "./tab-bar";

interface MainEditorProperties {
	children?: React.ReactNode;
	className?: string;
	scope?: string;
}

export function MainEditor({
	children,
	className,
	scope,
}: MainEditorProperties) {
	return (
		<main
			className={cn(
				"bg-background flex min-w-0 flex-1 flex-col overflow-hidden",
				className,
			)}
			aria-label="Main content area"
		>
			{/* Tab Bar */}
			<TabBar scope={scope} />

			{/* Content Area - driven by routing via Outlet */}
			<div className="flex-1 overflow-y-auto p-4">{children}</div>
		</main>
	);
}
