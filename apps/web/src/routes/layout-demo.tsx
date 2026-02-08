import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { useTabs } from "@/contexts/tab-context";

export const Route = createFileRoute("/layout-demo")({
	component: LayoutDemo,
	wrapInSuspense: false,
});

function LayoutDemo() {
	const { openTab, tabs, activeTabId } = useTabs();

	const handleOpenFile = (fileName: string, color: string) => {
		openTab({
			title: fileName,
			content: (
				<div className="space-y-4">
					<h1 className="font-bold text-2xl">{fileName}</h1>
					<div
						className="rounded-lg border border-border p-6"
						style={{ backgroundColor: color }}
					>
						<h2 className="mb-2 font-semibold text-lg">
							Content for {fileName}
						</h2>
						<p className="text-foreground/80">
							This is the unique content for {fileName}. Each tab can display
							different content!
						</p>
						<p className="mt-4 text-foreground/60 text-sm">
							Active Tab ID: {activeTabId}
						</p>
						<p className="text-foreground/60 text-sm">
							Total Tabs: {tabs.length}
						</p>
					</div>
				</div>
			),
		});
	};

	return (
		<AppLayout
			sidebarContent={
				<div className="space-y-2">
					<div className="mb-4">
						<h3 className="mb-2 font-medium text-sm">Tab Demo</h3>
						<div className="space-y-2">
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
								onClick={() => handleOpenFile("file1.tsx", "#fef3c7")}
							>
								📄 file1.tsx
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
								onClick={() => handleOpenFile("file2.tsx", "#dbeafe")}
							>
								📄 file2.tsx
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
								onClick={() => handleOpenFile("file3.tsx", "#dcfce7")}
							>
								📄 file3.tsx
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
								onClick={() => handleOpenFile("styles.css", "#fce7f3")}
							>
								🎨 styles.css
							</Button>
						</div>
					</div>
					<div className="mt-4 p-2 text-sidebar-foreground/60 text-xs">
						<p className="mb-2 font-medium">Keyboard Shortcuts:</p>
						<ul className="space-y-1">
							<li>⌘/Ctrl + Shift + W: Close</li>
							<li>⌘/Ctrl + Shift + T: New</li>
							<li>⌘/Ctrl + Shift + 1-9: Switch</li>
							<li>⌘/Ctrl + Shift + [/]: Prev/Next</li>
						</ul>
						<p className="mt-2 text-xs opacity-70">
							Check console for debug logs
						</p>
					</div>
				</div>
			}
			mainContent={
				<div className="space-y-4">
					<h1 className="font-bold text-2xl">Tab Management Demo</h1>
					<div className="rounded-lg border border-border bg-card p-6">
						<h2 className="mb-2 font-semibold text-lg">How to Test Tabs</h2>
						<ol className="list-inside list-decimal space-y-2 text-muted-foreground">
							<li>Click the file buttons in the left sidebar to open tabs</li>
							<li>Each tab shows different colored content</li>
							<li>Click tabs to switch between them</li>
							<li>Click the X button to close a tab</li>
							<li>Drag tabs to reorder them</li>
							<li>Try keyboard shortcuts (Cmd+W, Cmd+T, etc.)</li>
							<li>Refresh the page - your tabs persist!</li>
						</ol>
					</div>
					<div className="rounded-lg border border-border bg-card p-6">
						<h2 className="mb-2 font-semibold text-lg">Current State</h2>
						<div className="space-y-2 text-muted-foreground text-sm">
							<p>Open Tabs: {tabs.length}</p>
							<p>Active Tab: {activeTabId || "None"}</p>
						</div>
					</div>
				</div>
			}
			propertiesContent={
				<div className="space-y-2">
					<div className="rounded-md border border-border p-3">
						<h3 className="mb-2 font-medium text-sm">Tab Features</h3>
						<ul className="space-y-1 text-muted-foreground text-xs">
							<li>✅ Open/Close tabs</li>
							<li>✅ Switch between tabs</li>
							<li>✅ Drag to reorder</li>
							<li>✅ Keyboard shortcuts</li>
							<li>✅ Persist to localStorage</li>
							<li>✅ Unique content per tab</li>
						</ul>
					</div>
				</div>
			}
		/>
	);
}
