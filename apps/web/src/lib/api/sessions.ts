import { env } from "@megaforce/env/web";

import { authClient } from "../auth-client";

/**
 * Session types
 */
export type Session = {
	id: string;
	workspaceId: string;
	title: string;
	currentStage: string;
	status: string;
	outputTypes: string[] | null;
	clarifyingAnswers: Record<string, unknown> | null;
	dataSourceMode: string;
	createdAt: string;
	updatedAt: string;
	sessionPersonas?: {
		id: string;
		personaId: string;
		role: string;
		persona: { id: string; name: string; description: string | null };
	}[];
	sessionSources?: {
		id: string;
		sourceId: string;
		source: { id: string; title: string; type: string; url: string | null };
	}[];
	plans?: Plan[];
	outlines?: Outline[];
	generatedContent?: GeneratedContent[];
};

export type Plan = {
	id: string;
	sessionId: string;
	version: number;
	content: Record<string, unknown>;
	status: string;
	criticFeedback: unknown[] | null;
	criticIterations: number;
	createdAt: string;
};

export type Outline = {
	id: string;
	sessionId: string;
	planId: string;
	version: number;
	content: Record<string, unknown>;
	status: string;
	criticFeedback: unknown[] | null;
	criticIterations: number;
	createdAt: string;
};

export type GeneratedContent = {
	id: string;
	sessionId: string;
	outlineId: string;
	version: number;
	content: string;
	sections: unknown[] | null;
	status: string;
	criticFeedback: unknown[] | null;
	criticIterations: number;
	metrics: Record<string, unknown> | null;
	createdAt: string;
};

export type CreateSessionInput = {
	title: string;
};

export type UpdateSessionInput = {
	title?: string;
	outputTypes?: string[];
	clarifyingAnswers?: Record<string, unknown>;
	dataSourceMode?: string;
};

// Server wraps responses in { success, data }
type ApiResponse<T> = { success: boolean; data: T };

/**
 * Fetch helper with auth and JSON parsing
 */
async function fetchApi<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const session = await authClient.getSession();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string>),
	};

	if (session?.data?.session?.token) {
		headers.Authorization = `Bearer ${session.data.session.token}`;
	}

	const response = await fetch(`${env.VITE_SERVER_URL}${path}`, {
		...options,
		headers,
		credentials: "include",
	});

	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}));
		const message =
			(errorBody as Record<string, string>).message ??
			(errorBody as Record<string, string>).error ??
			`Request failed with status ${response.status}`;
		throw new Error(message);
	}

	// Handle 204 No Content
	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

/**
 * Sessions API functions
 */
export const sessionsApi = {
	/**
	 * Get all sessions (with optional search query)
	 */
	async getAll(query?: string): Promise<Session[]> {
		const params = query ? `?q=${encodeURIComponent(query)}` : "";
		const res = await fetchApi<ApiResponse<Session[]>>(
			`/api/sessions${params}`,
		);
		return res.data;
	},

	/**
	 * Get session by ID
	 */
	async getById(id: string): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(`/api/sessions/${id}`);
		return res.data;
	},

	/**
	 * Create a new session
	 */
	async create(input: CreateSessionInput): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>("/api/sessions", {
			method: "POST",
			body: JSON.stringify(input),
		});
		return res.data;
	},

	/**
	 * Update a session
	 */
	async update(id: string, input: UpdateSessionInput): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(`/api/sessions/${id}`, {
			method: "PATCH",
			body: JSON.stringify(input),
		});
		return res.data;
	},

	/**
	 * Delete a session
	 */
	async delete(id: string): Promise<void> {
		return fetchApi<void>(`/api/sessions/${id}`, {
			method: "DELETE",
		});
	},

	/**
	 * Advance session to next stage
	 */
	async advance(
		id: string,
		stageData?: Record<string, unknown>,
	): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(
			`/api/sessions/${id}/advance`,
			{
				method: "POST",
				body: JSON.stringify({ stageData: stageData ?? {} }),
			},
		);
		return res.data;
	},

	/**
	 * Go back to previous stage
	 */
	async back(id: string): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(
			`/api/sessions/${id}/back`,
			{ method: "POST" },
		);
		return res.data;
	},

	/**
	 * Generate a plan for the session
	 */
	async generatePlan(id: string): Promise<{ message: string }> {
		const res = await fetchApi<ApiResponse<{ message: string }>>(
			`/api/sessions/${id}/plan`,
			{ method: "POST" },
		);
		return res.data;
	},

	/**
	 * Get the latest plan for a session
	 */
	async getPlan(id: string): Promise<Plan | null> {
		const res = await fetchApi<ApiResponse<Plan | null>>(
			`/api/sessions/${id}/plan`,
		);
		return res.data;
	},

	/**
	 * Approve a plan
	 */
	async approvePlan(id: string): Promise<unknown> {
		const res = await fetchApi<ApiResponse<unknown>>(
			`/api/sessions/${id}/plan/approve`,
			{ method: "POST" },
		);
		return res.data;
	},

	async rejectPlan(id: string): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(
			`/api/sessions/${id}/plan/reject`,
			{ method: "POST" },
		);
		return res.data;
	},

	async editPlan(id: string, content: unknown): Promise<Plan> {
		const res = await fetchApi<ApiResponse<Plan>>(
			`/api/sessions/${id}/plan/edit`,
			{
				method: "POST",
				body: JSON.stringify({ content }),
			},
		);
		return res.data;
	},

	/**
	 * Generate an outline for the session
	 */
	async generateOutline(id: string): Promise<{ message: string }> {
		const res = await fetchApi<ApiResponse<{ message: string }>>(
			`/api/sessions/${id}/outline`,
			{ method: "POST" },
		);
		return res.data;
	},

	async getOutline(
		id: string,
	): Promise<{ outline: Outline | null; knowledgeBase: unknown }> {
		const res = await fetchApi<
			ApiResponse<{ outline: Outline | null; knowledgeBase: unknown }>
		>(`/api/sessions/${id}/outline`);
		return res.data;
	},

	async approveOutline(id: string): Promise<unknown> {
		const res = await fetchApi<ApiResponse<unknown>>(
			`/api/sessions/${id}/outline/approve`,
			{ method: "POST" },
		);
		return res.data;
	},

	async editOutline(id: string, content: unknown): Promise<Outline> {
		const res = await fetchApi<ApiResponse<Outline>>(
			`/api/sessions/${id}/outline/edit`,
			{
				method: "POST",
				body: JSON.stringify({ content }),
			},
		);
		return res.data;
	},

	/**
	 * Generate content for the session
	 */
	async generateContent(id: string): Promise<{ message: string }> {
		const res = await fetchApi<ApiResponse<{ message: string }>>(
			`/api/sessions/${id}/content`,
			{ method: "POST" },
		);
		return res.data;
	},

	async getContent(id: string): Promise<GeneratedContent | null> {
		const res = await fetchApi<ApiResponse<GeneratedContent | null>>(
			`/api/sessions/${id}/content`,
		);
		return res.data;
	},

	async approveContent(id: string): Promise<unknown> {
		const res = await fetchApi<ApiResponse<unknown>>(
			`/api/sessions/${id}/content/approve`,
			{ method: "POST" },
		);
		return res.data;
	},

	async editContent(
		id: string,
		content: string,
		sections?: unknown[],
	): Promise<GeneratedContent> {
		const res = await fetchApi<ApiResponse<GeneratedContent>>(
			`/api/sessions/${id}/content/edit`,
			{
				method: "POST",
				body: JSON.stringify({ content, sections }),
			},
		);
		return res.data;
	},

	/**
	 * Duplicate a session (copies stages 1-3 config)
	 */
	async duplicate(id: string): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(
			`/api/sessions/${id}/duplicate`,
			{ method: "POST" },
		);
		return res.data;
	},

	/**
	 * Archive a session
	 */
	async archive(id: string): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(
			`/api/sessions/${id}/archive`,
			{ method: "POST" },
		);
		return res.data;
	},

	/**
	 * Unarchive a session
	 */
	async unarchive(id: string): Promise<Session> {
		const res = await fetchApi<ApiResponse<Session>>(
			`/api/sessions/${id}/unarchive`,
			{ method: "POST" },
		);
		return res.data;
	},

	/**
	 * Export session content as markdown
	 */
	async exportMarkdown(id: string): Promise<string> {
		const session = await authClient.getSession();
		const headers: Record<string, string> = {};

		if (session?.data?.session?.token) {
			headers.Authorization = `Bearer ${session.data.session.token}`;
		}

		const response = await fetch(
			`${env.VITE_SERVER_URL}/api/sessions/${id}/export/markdown`,
			{
				headers,
				credentials: "include",
			},
		);

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			const message =
				(errorBody as Record<string, string>).message ??
				`Export failed with status ${response.status}`;
			throw new Error(message);
		}

		return response.text();
	},
};
