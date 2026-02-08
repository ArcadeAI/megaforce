import type { ApiResponse } from "./client";

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
	async getById(_id: string): Promise<ApiResponse<Workspace>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Create a new workspace
	 */
	async create(_input: CreateWorkspaceInput): Promise<ApiResponse<Workspace>> {
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
		_id: string,
		_input: UpdateWorkspaceInput,
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
	async delete(_id: string): Promise<ApiResponse<void>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
