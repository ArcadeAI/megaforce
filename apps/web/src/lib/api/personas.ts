import { env } from "@megaforce/env/web";
import { authClient } from "../auth-client";

/**
 * Persona types (matches server Prisma model)
 */
export type Persona = {
	id: string;
	workspaceId: string;
	name: string;
	description: string | null;
	styleProfile: Record<string, unknown>;
	vocabularyLevel: string | null;
	perspective: string | null;
	sentenceStyle: string | null;
	sampleOutput: string | null;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
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
		...((options.headers as Record<string, string>) ?? {}),
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

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export type CreatePersonaInput = Omit<
	Persona,
	"id" | "workspaceId" | "createdAt" | "updatedAt" | "isDefault"
>;

export type UpdatePersonaInput = Partial<
	Pick<
		Persona,
		| "name"
		| "description"
		| "styleProfile"
		| "vocabularyLevel"
		| "perspective"
		| "sentenceStyle"
		| "sampleOutput"
	>
>;

/**
 * Personas API functions
 */
export const personasApi = {
	async getAll(): Promise<Persona[]> {
		const res = await fetchApi<ApiResponse<Persona[]>>("/api/personas");
		return res.data;
	},

	async getById(id: string): Promise<Persona> {
		const res = await fetchApi<ApiResponse<Persona>>(`/api/personas/${id}`);
		return res.data;
	},

	async create(input: CreatePersonaInput): Promise<Persona> {
		const res = await fetchApi<ApiResponse<Persona>>("/api/personas", {
			method: "POST",
			body: JSON.stringify(input),
		});
		return res.data;
	},

	async update(id: string, input: UpdatePersonaInput): Promise<Persona> {
		const res = await fetchApi<ApiResponse<Persona>>(`/api/personas/${id}`, {
			method: "PATCH",
			body: JSON.stringify(input),
		});
		return res.data;
	},

	async delete(id: string): Promise<void> {
		return fetchApi<void>(`/api/personas/${id}`, {
			method: "DELETE",
		});
	},
};
