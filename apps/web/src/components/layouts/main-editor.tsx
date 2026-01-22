import { cn } from "@/lib/utils";

interface MainEditorProps {
	children?: React.ReactNode;
	className?: string;
}

export function MainEditor({ children, className }: MainEditorProps) {
	return (
		<main
			className={cn(
				"flex h-full flex-col overflow-hidden bg-background",
				className,
			)}
			aria-label="Main content area"
		>
			{/* Tab Bar / Header Area */}
			<div className="flex h-12 items-center border-border border-b px-4">
				<span className="font-medium text-foreground text-sm">Editor</span>
			</div>

			{/* Content Area */}
			<div className="flex-1 overflow-y-auto p-4">{children}</div>
		</main>
	);
}
