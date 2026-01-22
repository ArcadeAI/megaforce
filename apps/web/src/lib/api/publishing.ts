import { apiClient, type ApiResponse } from "./client";

/**
 * Publishing types
 */
export type PublishTarget = {
	id: string;
	projectId: string;
	name: string;
	type: "twitter" | "linkedin" | "blog" | "custom";
	config?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
};

export type PublishJob = {
	id: string;
	targetId: string;
	candidateId: string;
	status: "pending" | "publishing" | "published" | "failed";
	publishedAt?: Date;
	error?: string;
	createdAt: Date;
	updatedAt: Date;
};

export type CreatePublishTargetInput = {
	projectId: string;
	name: string;
	type: PublishTarget["type"];
	config?: Record<string, unknown>;
};

export type UpdatePublishTargetInput = Partial<
	Omit<CreatePublishTargetInput, "projectId">
>;

export type CreatePublishJobInput = {
	targetId: string;
	candidateId: string;
};

/**
 * Publishing API functions
 */
export const publishingApi = {
	/**
	 * Get all publish targets for a project
	 */
	async getTargetsByProject(
		projectId: string,
	): Promise<ApiResponse<PublishTarget[]>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: [],
		};
	},

	/**
	 * Create a new publish target
	 */
	async createTarget(
		input: CreatePublishTargetInput,
	): Promise<ApiResponse<PublishTarget>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Update a publish target
	 */
	async updateTarget(
		id: string,
		input: UpdatePublishTargetInput,
	): Promise<ApiResponse<PublishTarget>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Delete a publish target
	 */
	async deleteTarget(id: string): Promise<ApiResponse<void>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Create a new publish job
	 */
	async createJob(
		input: CreatePublishJobInput,
	): Promise<ApiResponse<PublishJob>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Get publish jobs for a target
	 */
	async getJobsByTarget(targetId: string): Promise<ApiResponse<PublishJob[]>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: [],
		};
	},

	/**
	 * Get publish job by ID
	 */
	async getJobById(id: string): Promise<ApiResponse<PublishJob>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Retry a failed publish job
	 */
	async retryJob(id: string): Promise<ApiResponse<PublishJob>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
