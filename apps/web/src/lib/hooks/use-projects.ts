import {
	useMutation,
	type UseMutationOptions,
	useQuery,
	useQueryClient,
	type UseQueryOptions,
} from "@tanstack/react-query";

import {
	type CreateProjectInput,
	type Project,
	projectsApi,
	type UpdateProjectInput,
} from "../api/projects";

/**
 * Query keys for projects
 */
export const projectKeys = {
	all: ["projects"] as const,
	lists: () => [...projectKeys.all, "list"] as const,
	list: (workspaceId?: string) =>
		[...projectKeys.lists(), { workspaceId }] as const,
	details: () => [...projectKeys.all, "detail"] as const,
	detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Hook to fetch projects for a workspace
 */
export function useProjects(
	workspaceId: string,
	options?: Omit<UseQueryOptions<Project[]>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: projectKeys.list(workspaceId),
		queryFn: async () => {
			const response = await projectsApi.getByWorkspace(workspaceId);
			if (response.error) {
				throw new Error(response.error.message);
			}
			return response.data ?? [];
		},
		enabled: !!workspaceId,
		...options,
	});
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(
	id: string,
	options?: Omit<UseQueryOptions<Project>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: projectKeys.detail(id),
		queryFn: async () => {
			const response = await projectsApi.getById(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Project not found");
			}
			return response.data;
		},
		enabled: !!id,
		...options,
	});
}

/**
 * Hook to create a new project
 */
export function useCreateProject(
	options?: UseMutationOptions<Project, Error, CreateProjectInput>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateProjectInput) => {
			const response = await projectsApi.create(input);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to create project");
			}
			return response.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: projectKeys.list(data.workspaceId),
			});
		},
		...options,
	});
}

/**
 * Hook to update a project
 */
export function useUpdateProject(
	options?: UseMutationOptions<
		Project,
		Error,
		{ id: string; input: UpdateProjectInput }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: string;
			input: UpdateProjectInput;
		}) => {
			const response = await projectsApi.update(id, input);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to update project");
			}
			return response.data;
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: projectKeys.list(data.workspaceId),
			});
			queryClient.invalidateQueries({
				queryKey: projectKeys.detail(variables.id),
			});
		},
		...options,
	});
}

/**
 * Hook to delete a project
 */
export function useDeleteProject(
	options?: UseMutationOptions<
		void,
		Error,
		{ id: string; workspaceId: string }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id }: { id: string; workspaceId: string }) => {
			const response = await projectsApi.delete(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
		},
		onSuccess: (_, { id, workspaceId }) => {
			queryClient.invalidateQueries({
				queryKey: projectKeys.list(workspaceId),
			});
			queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
		},
		...options,
	});
}

/**
 * Hook to duplicate a project
 */
export function useDuplicateProject(
	options?: UseMutationOptions<Project, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await projectsApi.duplicate(id);
			if (response.error) {
				throw new Error(response.error.message);
			}
			if (!response.data) {
				throw new Error("Failed to duplicate project");
			}
			return response.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: projectKeys.list(data.workspaceId),
			});
		},
		...options,
	});
}
