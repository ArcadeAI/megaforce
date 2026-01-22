import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type Candidate,
	type CreateCandidateInput,
	candidatesApi,
	type UpdateCandidateInput,
} from "../api/candidates";

/**
 * Query keys for candidates
 */
export const candidateKeys = {
	all: ["candidates"] as const,
	lists: () => [...candidateKeys.all, "list"] as const,
	list: (projectId?: string) =>
		[...candidateKeys.lists(), { projectId }] as const,
	details: () => [...candidateKeys.all, "detail"] as const,
	detail: (id: string) => [...candidateKeys.details(), id] as const,
};

/**
 * Hook to fetch candidates for a project
 */
export function useCandidates(
	projectId: string,
	options?: Omit<UseQueryOptions<Candidate[], Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: candidateKeys.list(projectId),
		queryFn: async () => {
			const response = await candidatesApi.getByProject(projectId);
			if (response.error) {
				throw new Error(response.error.message);
			}
			return response.data ?? [];
		},
		enabled: !!projectId,
		...options,
	});
}

/**
 * Hook to fetch a single candidate by ID
 */
export function useCandidate(
	id: string,
	options?: Omit<UseQueryOptions<Candidate, Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: candidateKeys.detail(id),
		queryFn: async () => {
			const response = await candidatesApi.getById(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Candidate not found");
			}
			return response.data;
		},
		enabled: !!id,
		...options,
	});
}

/**
 * Hook to create a new candidate
 */
export function useCreateCandidate(
	options?: UseMutationOptions<Candidate, Error, CreateCandidateInput>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateCandidateInput) => {
			const response = await candidatesApi.create(input);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to create candidate");
			}
			return response.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: candidateKeys.list(data.projectId),
			});
		},
		...options,
	});
}

/**
 * Hook to update a candidate
 */
export function useUpdateCandidate(
	options?: UseMutationOptions<
		Candidate,
		Error,
		{ id: string; input: UpdateCandidateInput }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: string;
			input: UpdateCandidateInput;
		}) => {
			const response = await candidatesApi.update(id, input);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to update candidate");
			}
			return response.data;
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: candidateKeys.list(data.projectId),
			});
			queryClient.invalidateQueries({
				queryKey: candidateKeys.detail(variables.id),
			});
		},
		...options,
	});
}

/**
 * Hook to delete a candidate
 */
export function useDeleteCandidate(
	options?: UseMutationOptions<void, Error, { id: string; projectId: string }>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id }: { id: string; projectId: string }) => {
			const response = await candidatesApi.delete(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
		},
		onSuccess: (_, { id, projectId }) => {
			queryClient.invalidateQueries({
				queryKey: candidateKeys.list(projectId),
			});
			queryClient.removeQueries({ queryKey: candidateKeys.detail(id) });
		},
		...options,
	});
}

/**
 * Hook to approve a candidate
 */
export function useApproveCandidate(
	options?: UseMutationOptions<
		Candidate,
		Error,
		{ id: string; projectId: string }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id }: { id: string; projectId: string }) => {
			const response = await candidatesApi.approve(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to approve candidate");
			}
			return response.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: candidateKeys.list(data.projectId),
			});
			queryClient.invalidateQueries({
				queryKey: candidateKeys.detail(data.id),
			});
		},
		...options,
	});
}

/**
 * Hook to reject a candidate
 */
export function useRejectCandidate(
	options?: UseMutationOptions<
		Candidate,
		Error,
		{ id: string; projectId: string }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id }: { id: string; projectId: string }) => {
			const response = await candidatesApi.reject(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to reject candidate");
			}
			return response.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: candidateKeys.list(data.projectId),
			});
			queryClient.invalidateQueries({
				queryKey: candidateKeys.detail(data.id),
			});
		},
		...options,
	});
}
