import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { AppLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { useTabs } from "@/contexts/tab-context";

export const Route = createFileRoute("/layout-demo")({
	component: LayoutDemo,
	wrapInSuspense: false,
});

interface FileEntry {
	name: string;
	color: string;
	icon: string;
}

const FILES: FileEntry[] = [
	{ name: "file1.tsx", color: "#fef3c7", icon: "\u{1F4C4}" },
	{ name: "file2.tsx", color: "#dbeafe", icon: "\u{1F4C4}" },
	{ name: "file3.tsx", color: "#dcfce7", icon: "\u{1F4C4}" },
	{ name: "styles.css", color: "#fce7f3", icon: "\u{1F3A8}" },
];

function makeFileTabId(fileName: string): string {
	return `file-${fileName}`;
}

function FileContent({ file }: { file: FileEntry }) {
	const { tabs, activeTabId } = useTabs();
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">{file.name}</h1>
			<div
				className="border-border rounded-lg border p-6"
				style={{ backgroundColor: file.color }}
			>
				<h2 className="mb-2 text-lg font-semibold">Content for {file.name}</h2>
				<p className="text-foreground/80">
					This is the unique content for {file.name}. Each tab can display
					different content!
				</p>
				<p className="text-foreground/60 mt-4 text-sm">
					Active Tab ID: {activeTabId}
				</p>
				<p className="text-foreground/60 text-sm">Total Tabs: {tabs.length}</p>
			</div>
		</div>
	);
}

function LayoutDemo() {
	const { openTab, tabs, activeTabId } = useTabs();
	const initialized = useRef(false);

	const handleOpenFile = (file: FileEntry) => {
		openTab({
			id: makeFileTabId(file.name),
			title: file.name,
			content: <FileContent file={file} />,
		});
	};

	// Auto-open the first two files as default tabs on mount
	useEffect(() => {
		if (initialized.current) {
			return;
		}
		initialized.current = true;

		const defaultFiles = FILES.slice(0, 2);
		for (const file of defaultFiles) {
			openTab({
				id: makeFileTabId(file.name),
				title: file.name,
				content: <FileContent file={file} />,
			});
		}
	}, [openTab]);

	return (
		<AppLayout
			sidebarContent={
				<div className="space-y-2">
					<div className="mb-4">
						<h3 className="mb-2 text-sm font-medium">Tab Demo</h3>
						<div className="space-y-2">
							{FILES.map((file) => (
								<Button
									key={file.name}
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={() => {
										handleOpenFile(file);
									}}
								>
									{file.icon} {file.name}
								</Button>
							))}
						</div>
					</div>
					<div className="text-sidebar-foreground/60 mt-4 p-2 text-xs">
						<p className="mb-2 font-medium">Keyboard Shortcuts:</p>
						<ul className="space-y-1">
							<li>\u2318/Ctrl + Shift + W: Close</li>
							<li>\u2318/Ctrl + Shift + T: New</li>
							<li>\u2318/Ctrl + Shift + 1-9: Switch</li>
							<li>\u2318/Ctrl + Shift + [/]: Prev/Next</li>
						</ul>
						<p className="mt-2 text-xs opacity-70">
							Check console for debug logs
						</p>
					</div>
				</div>
			}
			mainContent={
				<div className="space-y-4">
					<h1 className="text-2xl font-bold">Tab Management Demo</h1>
					<div className="border-border bg-card rounded-lg border p-6">
						<h2 className="mb-2 text-lg font-semibold">How to Test Tabs</h2>
						<ol className="text-muted-foreground list-inside list-decimal space-y-2">
							<li>Click the file buttons in the left sidebar to open tabs</li>
							<li>Each tab shows different colored content</li>
							<li>Click tabs to switch between them</li>
							<li>Click the X button to close a tab</li>
							<li>Drag tabs to reorder them</li>
							<li>Try keyboard shortcuts (Cmd+W, Cmd+T, etc.)</li>
							<li>Refresh the page - your tabs persist!</li>
						</ol>
					</div>
					<div className="border-border bg-card rounded-lg border p-6">
						<h2 className="mb-2 text-lg font-semibold">Current State</h2>
						<div className="text-muted-foreground space-y-2 text-sm">
							<p>Open Tabs: {tabs.length}</p>
							<p>Active Tab: {activeTabId || "None"}</p>
						</div>
					</div>
				</div>
			}
			propertiesContent={
				<div className="space-y-2">
					<div className="border-border rounded-md border p-3">
						<h3 className="mb-2 text-sm font-medium">Tab Features</h3>
						<ul className="text-muted-foreground space-y-1 text-xs">
							<li>Open/Close tabs</li>
							<li>Switch between tabs</li>
							<li>Drag to reorder</li>
							<li>Keyboard shortcuts</li>
							<li>Persist to localStorage</li>
							<li>Unique content per tab</li>
						</ul>
					</div>
				</div>
			}
		/>
	);
}
