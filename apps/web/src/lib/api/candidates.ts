import { apiClient, type ApiResponse } from "./client";

/**
 * Candidate types
 */
export type Candidate = {
	id: string;
	projectId: string;
	content: string;
	metadata?: Record<string, unknown>;
	score?: number;
	status: "pending" | "approved" | "rejected";
	createdAt: Date;
	updatedAt: Date;
};

export type CreateCandidateInput = {
	projectId: string;
	content: string;
	metadata?: Record<string, unknown>;
};

export type UpdateCandidateInput = {
	content?: string;
	metadata?: Record<string, unknown>;
	score?: number;
	status?: Candidate["status"];
};

/**
 * Candidate API functions
 */
export const candidatesApi = {
	/**
	 * Get all candidates for a project
	 */
	async getByProject(projectId: string): Promise<ApiResponse<Candidate[]>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: [],
		};
	},

	/**
	 * Get candidate by ID
	 */
	async getById(id: string): Promise<ApiResponse<Candidate>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Create a new candidate
	 */
	async create(input: CreateCandidateInput): Promise<ApiResponse<Candidate>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Update a candidate
	 */
	async update(
		id: string,
		input: UpdateCandidateInput,
	): Promise<ApiResponse<Candidate>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Delete a candidate
	 */
	async delete(id: string): Promise<ApiResponse<void>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Approve a candidate
	 */
	async approve(id: string): Promise<ApiResponse<Candidate>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Reject a candidate
	 */
	async reject(id: string): Promise<ApiResponse<Candidate>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
