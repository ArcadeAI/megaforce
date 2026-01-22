import { apiClient, type ApiResponse } from "./client";

/**
 * Workspace types
 */
export type Workspace = {
	id: string;
	name: string;
	slug: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateWorkspaceInput = {
	name: string;
	slug: string;
	description?: string;
};

export type UpdateWorkspaceInput = Partial<CreateWorkspaceInput>;

/**
 * Workspace API functions
 */
export const workspacesApi = {
	/**
	 * Get all workspaces
	 */
	async getAll(): Promise<ApiResponse<Workspace[]>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: [],
		};
	},

	/**
	 * Get workspace by ID
	 */
	async getById(id: string): Promise<ApiResponse<Workspace>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Create a new workspace
	 */
	async create(input: CreateWorkspaceInput): Promise<ApiResponse<Workspace>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Update a workspace
	 */
	async update(
		id: string,
		input: UpdateWorkspaceInput,
	): Promise<ApiResponse<Workspace>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Delete a workspace
	 */
	async delete(id: string): Promise<ApiResponse<void>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
