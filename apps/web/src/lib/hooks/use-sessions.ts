import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type CreateSessionInput,
	type GeneratedContent,
	type Outline,
	type Plan,
	type Session,
	sessionsApi,
	type UpdateSessionInput,
} from "../api/sessions";

/**
 * Query keys for sessions
 */
export const sessionKeys = {
	all: ["sessions"] as const,
	lists: () => [...sessionKeys.all, "list"] as const,
	list: () => [...sessionKeys.lists()] as const,
	details: () => [...sessionKeys.all, "detail"] as const,
	detail: (id: string) => [...sessionKeys.details(), id] as const,
	plans: () => [...sessionKeys.all, "plan"] as const,
	plan: (sessionId: string) => [...sessionKeys.plans(), sessionId] as const,
	outlines: () => [...sessionKeys.all, "outline"] as const,
	outline: (sessionId: string) =>
		[...sessionKeys.outlines(), sessionId] as const,
	contents: () => [...sessionKeys.all, "content"] as const,
	content: (sessionId: string) =>
		[...sessionKeys.contents(), sessionId] as const,
};

/**
 * Hook to fetch all sessions
 */
export function useSessions(
	options?: Omit<UseQueryOptions<Session[], Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: sessionKeys.list(),
		queryFn: async () => {
			return sessionsApi.getAll();
		},
		...options,
	});
}

/**
 * Hook to fetch a single session by ID
 */
export function useSession(
	id: string,
	options?: Omit<UseQueryOptions<Session, Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: sessionKeys.detail(id),
		queryFn: async () => {
			return sessionsApi.getById(id);
		},
		enabled: !!id,
		...options,
	});
}

/**
 * Hook to create a new session
 */
export function useCreateSession(
	options?: UseMutationOptions<Session, Error, CreateSessionInput>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateSessionInput) => {
			return sessionsApi.create(input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
		},
		...options,
	});
}

/**
 * Hook to update a session
 */
export function useUpdateSession(
	options?: UseMutationOptions<
		Session,
		Error,
		{ id: string; input: UpdateSessionInput }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: string;
			input: UpdateSessionInput;
		}) => {
			return sessionsApi.update(id, input);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(variables.id),
			});
		},
		...options,
	});
}

/**
 * Hook to delete a session
 */
export function useDeleteSession(
	options?: UseMutationOptions<void, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return sessionsApi.delete(id);
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
			queryClient.removeQueries({ queryKey: sessionKeys.detail(id) });
		},
		...options,
	});
}

/**
 * Hook to advance session to next stage
 */
export function useAdvanceStage(
	options?: UseMutationOptions<
		Session,
		Error,
		{ id: string; stageData?: Record<string, unknown> }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			stageData,
		}: {
			id: string;
			stageData?: Record<string, unknown>;
		}) => {
			return sessionsApi.advance(id, stageData);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(variables.id),
			});
		},
		...options,
	});
}

/**
 * Hook to go back to previous stage
 */
export function useGoBack(
	options?: UseMutationOptions<Session, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return sessionsApi.back(id);
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(id),
			});
		},
		...options,
	});
}

/**
 * Hook to generate a plan
 */
export function useGeneratePlan(
	options?: UseMutationOptions<{ message: string }, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			return sessionsApi.generatePlan(sessionId);
		},
		onSuccess: (_, sessionId) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.plan(sessionId),
			});
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to fetch the latest plan for a session
 */
export function usePlan(
	sessionId: string,
	options?: Omit<UseQueryOptions<Plan | null, Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: sessionKeys.plan(sessionId),
		queryFn: async () => {
			return sessionsApi.getPlan(sessionId);
		},
		enabled: !!sessionId,
		...options,
	});
}

/**
 * Hook to approve a plan
 */
export function useApprovePlan(
	options?: UseMutationOptions<unknown, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			return sessionsApi.approvePlan(sessionId);
		},
		onSuccess: (_, sessionId) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.plan(sessionId),
			});
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to edit a plan
 */
export function useEditPlan(
	options?: UseMutationOptions<
		Plan,
		Error,
		{ sessionId: string; content: string }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			sessionId,
			content,
		}: {
			sessionId: string;
			content: string;
		}) => {
			return sessionsApi.editPlan(sessionId, content);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.plan(variables.sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to generate an outline
 */
export function useGenerateOutline(
	options?: UseMutationOptions<{ message: string }, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			return sessionsApi.generateOutline(sessionId);
		},
		onSuccess: (_, sessionId) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.outline(sessionId),
			});
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to fetch the latest outline for a session
 */
export function useOutline(
	sessionId: string,
	options?: Omit<
		UseQueryOptions<Outline | null, Error>,
		"queryKey" | "queryFn"
	>,
) {
	return useQuery({
		queryKey: sessionKeys.outline(sessionId),
		queryFn: async () => {
			const res = await sessionsApi.getOutline(sessionId);
			return res.outline;
		},
		enabled: !!sessionId,
		...options,
	});
}

/**
 * Hook to approve an outline
 */
export function useApproveOutline(
	options?: UseMutationOptions<unknown, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			return sessionsApi.approveOutline(sessionId);
		},
		onSuccess: (_, sessionId) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.outline(sessionId),
			});
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to edit an outline
 */
export function useEditOutline(
	options?: UseMutationOptions<
		Outline,
		Error,
		{ sessionId: string; content: string }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			sessionId,
			content,
		}: {
			sessionId: string;
			content: string;
		}) => {
			return sessionsApi.editOutline(sessionId, content);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.outline(variables.sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to generate content
 */
export function useGenerateContent(
	options?: UseMutationOptions<{ message: string }, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			return sessionsApi.generateContent(sessionId);
		},
		onSuccess: (_, sessionId) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.content(sessionId),
			});
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to fetch the latest generated content for a session
 */
export function useContent(
	sessionId: string,
	options?: Omit<
		UseQueryOptions<GeneratedContent | null, Error>,
		"queryKey" | "queryFn"
	>,
) {
	return useQuery({
		queryKey: sessionKeys.content(sessionId),
		queryFn: async () => {
			return sessionsApi.getContent(sessionId);
		},
		enabled: !!sessionId,
		...options,
	});
}

/**
 * Hook to approve generated content
 */
export function useApproveContent(
	options?: UseMutationOptions<unknown, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			return sessionsApi.approveContent(sessionId);
		},
		onSuccess: (_, sessionId) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.content(sessionId),
			});
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to edit generated content
 */
export function useEditContent(
	options?: UseMutationOptions<
		GeneratedContent,
		Error,
		{
			sessionId: string;
			content: string;
			sections?: Record<string, unknown>[];
		}
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			sessionId,
			content,
			sections,
		}: {
			sessionId: string;
			content: string;
			sections?: Record<string, unknown>[];
		}) => {
			return sessionsApi.editContent(sessionId, content, sections);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: sessionKeys.content(variables.sessionId),
			});
		},
		...options,
	});
}

/**
 * Hook to duplicate a session
 */
export function useDuplicateSession(
	options?: UseMutationOptions<Session, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return sessionsApi.duplicate(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
		},
		...options,
	});
}

/**
 * Hook to archive a session
 */
export function useArchiveSession(
	options?: UseMutationOptions<Session, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return sessionsApi.archive(id);
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(id),
			});
		},
		...options,
	});
}

/**
 * Hook to unarchive a session
 */
export function useUnarchiveSession(
	options?: UseMutationOptions<Session, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return sessionsApi.unarchive(id);
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: sessionKeys.detail(id),
			});
		},
		...options,
	});
}
