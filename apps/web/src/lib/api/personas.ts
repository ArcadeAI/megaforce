import { type ApiResponse, apiClient } from "./client";

/**
 * Persona types
 */
export type Persona = {
	id: string;
	workspaceId: string;
	name: string;
	role: string;
	description?: string;
	traits: string[];
	expertise: string[];
	createdAt: Date;
	updatedAt: Date;
};

export type CreatePersonaInput = {
	workspaceId: string;
	name: string;
	role: string;
	description?: string;
	traits?: string[];
	expertise?: string[];
};

export type UpdatePersonaInput = Partial<
	Omit<CreatePersonaInput, "workspaceId">
>;

/**
 * Persona API functions
 */
export const personasApi = {
	/**
	 * Get all personas for a workspace
	 */
	async getByWorkspace(workspaceId: string): Promise<ApiResponse<Persona[]>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: [],
		};
	},

	/**
	 * Get persona by ID
	 */
	async getById(id: string): Promise<ApiResponse<Persona>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Create a new persona
	 */
	async create(input: CreatePersonaInput): Promise<ApiResponse<Persona>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Update a persona
	 */
	async update(
		id: string,
		input: UpdatePersonaInput,
	): Promise<ApiResponse<Persona>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Delete a persona
	 */
	async delete(id: string): Promise<ApiResponse<void>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
