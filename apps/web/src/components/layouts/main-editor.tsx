import { useTabs } from "@/contexts/tab-context";
import { cn } from "@/lib/utils";
import { TabBar } from "./tab-bar";

interface MainEditorProps {
	children?: React.ReactNode;
	className?: string;
}

export function MainEditor({ children, className }: MainEditorProps) {
	const { tabs, activeTabId } = useTabs();
	const activeTab = tabs.find((tab) => tab.id === activeTabId);

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

			{/* Content Area */}
			<div className="flex-1 overflow-y-auto p-4">
				{activeTab?.content || children}
			</div>
		</main>
	);
}
