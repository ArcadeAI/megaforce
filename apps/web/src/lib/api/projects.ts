import type { ApiResponse } from "./client";

/**
 * Project types
 */
export type Project = {
	id: string;
	workspaceId: string;
	name: string;
	description?: string;
	status: "draft" | "active" | "archived";
	settings?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateProjectInput = {
	workspaceId: string;
	name: string;
	description?: string;
	status?: Project["status"];
	settings?: Record<string, unknown>;
};

export type UpdateProjectInput = Partial<
	Omit<CreateProjectInput, "workspaceId">
>;

/**
 * Project API functions
 */
export const projectsApi = {
	/**
	 * Get all projects for a workspace
	 */
	async getByWorkspace(_workspaceId: string): Promise<ApiResponse<Project[]>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: [],
		};
	},

	/**
	 * Get project by ID
	 */
	async getById(_id: string): Promise<ApiResponse<Project>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Create a new project
	 */
	async create(_input: CreateProjectInput): Promise<ApiResponse<Project>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Update a project
	 */
	async update(
		_id: string,
		_input: UpdateProjectInput,
	): Promise<ApiResponse<Project>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Delete a project
	 */
	async delete(_id: string): Promise<ApiResponse<void>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Duplicate a project
	 */
	async duplicate(_id: string): Promise<ApiResponse<Project>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
