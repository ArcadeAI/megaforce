import { type ApiResponse, apiClient } from "./client";

/**
 * Source types
 */
export type Source = {
	id: string;
	workspaceId: string;
	name: string;
	type: "github" | "linear" | "notion" | "custom";
	url?: string;
	config?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateSourceInput = {
	workspaceId: string;
	name: string;
	type: Source["type"];
	url?: string;
	config?: Record<string, unknown>;
};

export type UpdateSourceInput = Partial<Omit<CreateSourceInput, "workspaceId">>;

/**
 * Source API functions
 */
export const sourcesApi = {
	/**
	 * Get all sources for a workspace
	 */
	async getByWorkspace(workspaceId: string): Promise<ApiResponse<Source[]>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: [],
		};
	},

	/**
	 * Get source by ID
	 */
	async getById(id: string): Promise<ApiResponse<Source>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Create a new source
	 */
	async create(input: CreateSourceInput): Promise<ApiResponse<Source>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Update a source
	 */
	async update(
		id: string,
		input: UpdateSourceInput,
	): Promise<ApiResponse<Source>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Delete a source
	 */
	async delete(id: string): Promise<ApiResponse<void>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Test source connection
	 */
	async testConnection(
		id: string,
	): Promise<ApiResponse<{ connected: boolean }>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
