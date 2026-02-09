import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { MainEditor } from "./main-editor";
import { PropertiesPanel } from "./properties-panel";
import { SidebarNav } from "./sidebar-nav";

interface AppLayoutProperties {
	sidebarContent?: React.ReactNode;
	mainContent?: React.ReactNode;
	propertiesContent?: React.ReactNode;
	className?: string;
	scope?: string;
}

const STORAGE_KEYS = {
	sidebarWidth: "app-layout-sidebar-width",
	sidebarCollapsed: "app-layout-sidebar-collapsed",
	propertiesWidth: "app-layout-properties-width",
	propertiesCollapsed: "app-layout-properties-collapsed",
};

const DEFAULT_VALUES = {
	sidebarWidth: 280,
	propertiesWidth: 300,
};

export function AppLayout({
	sidebarContent,
	mainContent,
	propertiesContent,
	className,
	scope,
}: AppLayoutProperties) {
	// Sidebar state
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEYS.sidebarWidth);
		return stored ? Number.parseInt(stored, 10) : DEFAULT_VALUES.sidebarWidth;
	});

	const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
		return stored === "true";
	});

	// Properties panel state
	const [propertiesWidth, setPropertiesWidth] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEYS.propertiesWidth);
		return stored
			? Number.parseInt(stored, 10)
			: DEFAULT_VALUES.propertiesWidth;
	});

	const [propertiesCollapsed, setPropertiesCollapsed] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEYS.propertiesCollapsed);
		return stored === "true";
	});

	// Persist sidebar width
	useEffect(() => {
		localStorage.setItem(STORAGE_KEYS.sidebarWidth, sidebarWidth.toString());
	}, [sidebarWidth]);

	// Persist sidebar collapsed state
	useEffect(() => {
		localStorage.setItem(
			STORAGE_KEYS.sidebarCollapsed,
			sidebarCollapsed.toString(),
		);
	}, [sidebarCollapsed]);

	// Persist properties width
	useEffect(() => {
		localStorage.setItem(
			STORAGE_KEYS.propertiesWidth,
			propertiesWidth.toString(),
		);
	}, [propertiesWidth]);

	// Persist properties collapsed state
	useEffect(() => {
		localStorage.setItem(
			STORAGE_KEYS.propertiesCollapsed,
			propertiesCollapsed.toString(),
		);
	}, [propertiesCollapsed]);

	return (
		<div className={cn("flex h-full w-full overflow-hidden", className)}>
			{/* Left Sidebar */}
			<SidebarNav
				width={sidebarWidth}
				isCollapsed={sidebarCollapsed}
				onWidthChange={setSidebarWidth}
				onToggleCollapse={() => {
					setSidebarCollapsed(!sidebarCollapsed);
				}}
				minWidth={200}
				maxWidth={400}
			>
				{sidebarContent}
			</SidebarNav>

			{/* Main Content Area */}
			<MainEditor scope={scope}>{mainContent}</MainEditor>

			{/* Right Properties Panel */}
			<PropertiesPanel
				width={propertiesWidth}
				isCollapsed={propertiesCollapsed}
				onWidthChange={setPropertiesWidth}
				onToggleCollapse={() => {
					setPropertiesCollapsed(!propertiesCollapsed);
				}}
				minWidth={250}
				maxWidth={400}
			>
				{propertiesContent}
			</PropertiesPanel>
		</div>
	);
}
