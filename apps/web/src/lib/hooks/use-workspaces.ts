import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationOptions,
	type UseQueryOptions,
} from "@tanstack/react-query";
import {
	workspacesApi,
	type CreateWorkspaceInput,
	type UpdateWorkspaceInput,
	type Workspace,
} from "../api/workspaces";

/**
 * Query keys for workspaces
 */
export const workspaceKeys = {
	all: ["workspaces"] as const,
	lists: () => [...workspaceKeys.all, "list"] as const,
	list: () => [...workspaceKeys.lists()] as const,
	details: () => [...workspaceKeys.all, "detail"] as const,
	detail: (id: string) => [...workspaceKeys.details(), id] as const,
};

/**
 * Hook to fetch all workspaces
 */
export function useWorkspaces(
	options?: Omit<
		UseQueryOptions<Workspace[], Error>,
		"queryKey" | "queryFn"
	>,
) {
	return useQuery({
		queryKey: workspaceKeys.list(),
		queryFn: async () => {
			const response = await workspacesApi.getAll();
			if (response.error) {
				throw new Error(response.error.message);
			}
			return response.data ?? [];
		},
		...options,
	});
}

/**
 * Hook to fetch a single workspace by ID
 */
export function useWorkspace(
	id: string,
	options?: Omit<UseQueryOptions<Workspace, Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: workspaceKeys.detail(id),
		queryFn: async () => {
			const response = await workspacesApi.getById(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Workspace not found");
			}
			return response.data;
		},
		enabled: !!id,
		...options,
	});
}

/**
 * Hook to create a new workspace
 */
export function useCreateWorkspace(
	options?: UseMutationOptions<Workspace, Error, CreateWorkspaceInput>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateWorkspaceInput) => {
			const response = await workspacesApi.create(input);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to create workspace");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
		},
		...options,
	});
}

/**
 * Hook to update a workspace
 */
export function useUpdateWorkspace(
	options?: UseMutationOptions<
		Workspace,
		Error,
		{ id: string; input: UpdateWorkspaceInput }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, input }: { id: string; input: UpdateWorkspaceInput }) => {
			const response = await workspacesApi.update(id, input);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to update workspace");
			}
			return response.data;
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: workspaceKeys.detail(variables.id),
			});
		},
		...options,
	});
}

/**
 * Hook to delete a workspace
 */
export function useDeleteWorkspace(
	options?: UseMutationOptions<void, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await workspacesApi.delete(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
			queryClient.removeQueries({ queryKey: workspaceKeys.detail(id) });
		},
		...options,
	});
}
