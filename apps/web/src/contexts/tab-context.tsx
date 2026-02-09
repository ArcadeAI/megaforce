import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export interface Tab {
	id: string;
	title: string;
	content?: ReactNode;
	isDirty?: boolean;
	metadata?: Record<string, unknown>;
}

interface TabContextValue {
	tabs: Tab[];
	activeTabId: string | null;
	openTab: (tab: Omit<Tab, "id"> & { id?: string }) => string;
	closeTab: (tabId: string) => void;
	switchTab: (tabId: string) => void;
	updateTab: (tabId: string, updates: Partial<Tab>) => void;
	reorderTabs: (fromIndex: number, toIndex: number) => void;
	closeAllTabs: () => void;
	closeOtherTabs: (tabId: string) => void;
}

const TabContext = createContext<TabContextValue | undefined>(undefined);

const STORAGE_KEY = "megaforce-tabs";
const ACTIVE_TAB_KEY = "megaforce-active-tab";

interface StoredTab {
	id: string;
	title: string;
	isDirty?: boolean;
	metadata?: Record<string, unknown>;
}

function generateTabId(): string {
	return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function loadTabsFromStorage(): Tab[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return [];
		}
		const parsed = JSON.parse(stored) as StoredTab[];
		return parsed.map((tab) => ({
			...tab,
			content: undefined,
		}));
	} catch {
		return [];
	}
}

function loadActiveTabFromStorage(): string | null {
	try {
		return localStorage.getItem(ACTIVE_TAB_KEY);
	} catch {
		return null;
	}
}

function saveTabsToStorage(tabs: Tab[]): void {
	try {
		const toStore: StoredTab[] = tabs.map((tab) => ({
			id: tab.id,
			title: tab.title,
			isDirty: tab.isDirty,
			metadata: tab.metadata,
		}));
		localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
	} catch (error) {
		console.error("Failed to save tabs to localStorage:", error);
	}
}

function saveActiveTabToStorage(tabId: string | null): void {
	try {
		if (tabId) {
			localStorage.setItem(ACTIVE_TAB_KEY, tabId);
		} else {
			localStorage.removeItem(ACTIVE_TAB_KEY);
		}
	} catch (error) {
		console.error("Failed to save active tab to localStorage:", error);
	}
}

export function TabProvider({ children }: { children: ReactNode }) {
	const [tabs, setTabs] = useState<Tab[]>(() => loadTabsFromStorage());

	const [activeTabId, setActiveTabId] = useState<string | null>(() => {
		const storedActiveId = loadActiveTabFromStorage();
		if (storedActiveId && tabs.some((t) => t.id === storedActiveId)) {
			return storedActiveId;
		}
		return tabs.length > 0 ? tabs[0].id : null;
	});

	// Persist tabs to localStorage whenever they change
	useEffect(() => {
		saveTabsToStorage(tabs);
	}, [tabs]);

	// Persist active tab to localStorage whenever it changes
	useEffect(() => {
		saveActiveTabToStorage(activeTabId);
	}, [activeTabId]);

	const openTab = useCallback(
		(tab: Omit<Tab, "id"> & { id?: string }): string => {
			const tabId = tab.id || generateTabId();

			setTabs((prevTabs) => {
				// Check if tab already exists
				const existingTab = prevTabs.find((t) => t.id === tabId);
				if (existingTab) {
					// Update existing tab
					return prevTabs.map((t) => (t.id === tabId ? { ...t, ...tab } : t));
				}
				// Add new tab
				return [...prevTabs, { ...tab, id: tabId }];
			});

			setActiveTabId(tabId);
			return tabId;
		},
		[],
	);

	const closeTab = useCallback((tabId: string) => {
		setTabs((prevTabs) => {
			const index = prevTabs.findIndex((t) => t.id === tabId);
			if (index === -1) {
				return prevTabs;
			}

			const newTabs = prevTabs.filter((t) => t.id !== tabId);

			// If we're closing the active tab, switch to adjacent tab
			setActiveTabId((prevActiveId) => {
				if (prevActiveId !== tabId) {
					return prevActiveId;
				}

				if (newTabs.length === 0) {
					return null;
				}

				// Switch to the tab to the right, or left if at the end
				const newIndex = index < newTabs.length ? index : index - 1;
				return newTabs[newIndex].id;
			});

			return newTabs;
		});
	}, []);

	const switchTab = useCallback((tabId: string) => {
		setTabs((prevTabs) => {
			const exists = prevTabs.some((t) => t.id === tabId);
			if (!exists) {
				return prevTabs;
			}

			setActiveTabId(tabId);
			return prevTabs;
		});
	}, []);

	const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
		setTabs((prevTabs) =>
			prevTabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
		);
	}, []);

	const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
		setTabs((prevTabs) => {
			if (
				fromIndex < 0 ||
				fromIndex >= prevTabs.length ||
				toIndex < 0 ||
				toIndex >= prevTabs.length
			) {
				return prevTabs;
			}

			const newTabs = [...prevTabs];
			const [movedTab] = newTabs.splice(fromIndex, 1);
			newTabs.splice(toIndex, 0, movedTab);
			return newTabs;
		});
	}, []);

	const closeAllTabs = useCallback(() => {
		setTabs([]);
		setActiveTabId(null);
	}, []);

	const closeOtherTabs = useCallback((tabId: string) => {
		setTabs((prevTabs) => {
			const tab = prevTabs.find((t) => t.id === tabId);
			return tab ? [tab] : prevTabs;
		});
		setActiveTabId(tabId);
	}, []);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMac = navigator.platform.toUpperCase().includes("MAC");
			const modifier = isMac ? e.metaKey : e.ctrlKey;

			// Ctrl/Cmd + Shift + W: Close active tab
			if (
				modifier &&
				e.shiftKey &&
				e.key.toLowerCase() === "w" &&
				activeTabId
			) {
				e.preventDefault();
				console.log("Closing tab with Ctrl/Cmd + Shift + W");
				closeTab(activeTabId);
				return;
			}

			// Ctrl/Cmd + Shift + T: Open new tab
			if (modifier && e.shiftKey && e.key.toLowerCase() === "t") {
				e.preventDefault();
				console.log("Opening new tab with Ctrl/Cmd + Shift + T");
				openTab({ title: "New Tab" });
				return;
			}

			// Ctrl/Cmd + Shift + 1-9: Switch to tab by index
			if (modifier && e.shiftKey) {
				const number_ = Number.parseInt(e.key, 10);
				if (number_ >= 1 && number_ <= 9) {
					e.preventDefault();
					const tabIndex = number_ - 1;
					if (tabs[tabIndex]) {
						console.log(`Switching to tab ${number_}`);
						switchTab(tabs[tabIndex].id);
					}
					return;
				}
			}

			// Ctrl/Cmd + Shift + [: Previous tab
			if (modifier && e.shiftKey && e.key === "[" && activeTabId) {
				e.preventDefault();
				console.log("Previous tab");
				const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
				const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
				switchTab(tabs[prevIndex].id);
				return;
			}

			// Ctrl/Cmd + Shift + ]: Next tab
			if (modifier && e.shiftKey && e.key === "]" && activeTabId) {
				e.preventDefault();
				console.log("Next tab");
				const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
				const nextIndex = (currentIndex + 1) % tabs.length;
				switchTab(tabs[nextIndex].id);
			}
		};

		globalThis.addEventListener("keydown", handleKeyDown);
		return () => {
			globalThis.removeEventListener("keydown", handleKeyDown);
		};
	}, [tabs, activeTabId, closeTab, openTab, switchTab]);

	const value: TabContextValue = {
		tabs,
		activeTabId,
		openTab,
		closeTab,
		switchTab,
		updateTab,
		reorderTabs,
		closeAllTabs,
		closeOtherTabs,
	};

	return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useTabs(): TabContextValue {
	const context = useContext(TabContext);
	if (!context) {
		throw new Error("useTabs must be used within a TabProvider");
	}
	return context;
}

export function useScopedTabs(prefix: string): TabContextValue {
	const ctx = useTabs();
	const tabs = useMemo(
		() => ctx.tabs.filter((t) => t.id.startsWith(prefix)),
		[ctx.tabs, prefix],
	);
	const activeTabId = ctx.activeTabId?.startsWith(prefix)
		? ctx.activeTabId
		: null;

	return useMemo(
		() => ({ ...ctx, tabs, activeTabId }),
		[ctx, tabs, activeTabId],
	);
}
