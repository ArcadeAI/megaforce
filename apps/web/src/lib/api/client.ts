import { treaty } from "@elysiajs/eden";
import { env } from "@megaforce/env/web";

import type { App } from "../../../../server/src/index";
import { authClient } from "../auth-client";

/**
 * Base API client with auth headers
 */
export const apiClient = treaty<App>(env.VITE_SERVER_URL, {
	fetch: {
		credentials: "include",
	},
	onRequest: async (_path, options) => {
		// Get the current session from better-auth
		const session = await authClient.getSession();

		// Add auth headers if session exists
		if (session?.data?.session?.token) {
			options.headers = {
				...options.headers,
				Authorization: `Bearer ${session.data.session.token}`,
			};
		}

		return options;
	},
});

/**
 * API error types
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public status?: number,
		public code?: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): ApiError {
	if (error instanceof ApiError) {
		return error;
	}

	if (error instanceof Error) {
		return new ApiError(error.message);
	}

	return new ApiError("An unknown error occurred");
}

/**
 * Generic API response type
 */
export type ApiResponse<T> = {
	data?: T;
	error?: {
		message: string;
		code?: string;
		status?: number;
	};
};

/**
 * Create a typed API response
 */
export function createApiResponse<T>(
	data?: T,
	error?: { message: string; code?: string; status?: number },
): ApiResponse<T> {
	return { data, error };
}
