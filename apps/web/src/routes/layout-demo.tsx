import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts";

export const Route = createFileRoute("/layout-demo")({
	component: LayoutDemo,
	wrapInSuspense: false,
});

function LayoutDemo() {
	return (
		<div className="flex flex-1 flex-col">
			<AppLayout
				sidebarContent={
					<div className="space-y-2">
						<div className="rounded-md bg-sidebar-accent p-3 text-sm">
							Navigation Item 1
						</div>
						<div className="rounded-md bg-sidebar-accent p-3 text-sm">
							Navigation Item 2
						</div>
						<div className="rounded-md bg-sidebar-accent p-3 text-sm">
							Navigation Item 3
						</div>
						<div className="mt-4 p-2 text-sidebar-foreground/60 text-xs">
							<p>This sidebar is resizable (200-400px)</p>
							<p className="mt-2">Click the chevron to collapse/expand</p>
						</div>
					</div>
				}
				mainContent={
					<div className="space-y-4">
						<h1 className="font-bold text-2xl">VS Code-Style Layout Demo</h1>
						<div className="rounded-lg border border-border bg-card p-6">
							<h2 className="mb-2 font-semibold text-lg">Main Editor Area</h2>
							<p className="text-muted-foreground">
								This is the main content area that automatically fills the
								available space between the left sidebar and right properties
								panel.
							</p>
						</div>
						<div className="rounded-lg border border-border bg-card p-6">
							<h2 className="mb-2 font-semibold text-lg">Features</h2>
							<ul className="list-inside list-disc space-y-1 text-muted-foreground">
								<li>Resizable sidebars with mouse drag</li>
								<li>Collapsible panels (click chevron buttons)</li>
								<li>Persistent layout state (localStorage)</li>
								<li>Smooth transitions</li>
								<li>Responsive design</li>
							</ul>
						</div>
						<div className="rounded-lg border border-border bg-card p-6">
							<h2 className="mb-2 font-semibold text-lg">Try It Out</h2>
							<p className="text-muted-foreground">
								Drag the resize handles between panels to adjust widths. Click
								the chevron buttons to collapse/expand sidebars. Your
								preferences will be saved!
							</p>
						</div>
					</div>
				}
				propertiesContent={
					<div className="space-y-2">
						<div className="rounded-md border border-border p-3">
							<h3 className="mb-2 font-medium text-sm">Property 1</h3>
							<p className="text-muted-foreground text-xs">Value: Example</p>
						</div>
						<div className="rounded-md border border-border p-3">
							<h3 className="mb-2 font-medium text-sm">Property 2</h3>
							<p className="text-muted-foreground text-xs">Value: Demo</p>
						</div>
						<div className="rounded-md border border-border p-3">
							<h3 className="mb-2 font-medium text-sm">Property 3</h3>
							<p className="text-muted-foreground text-xs">Value: Test</p>
						</div>
						<div className="mt-4 p-2 text-sidebar-foreground/60 text-xs">
							<p>This panel is resizable (250-400px)</p>
							<p className="mt-2">Click the chevron to collapse/expand</p>
						</div>
					</div>
				}
			/>
		</div>
	);
}
