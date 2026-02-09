import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type CreatePersonaInput,
	type Persona,
	personasApi,
	type UpdatePersonaInput,
} from "../api/personas";

/**
 * Query keys for personas
 */
export const personaKeys = {
	all: ["personas"] as const,
	lists: () => [...personaKeys.all, "list"] as const,
	list: () => [...personaKeys.lists()] as const,
	details: () => [...personaKeys.all, "detail"] as const,
	detail: (id: string) => [...personaKeys.details(), id] as const,
};

/**
 * Hook to fetch all personas for the current workspace
 */
export function usePersonas(
	options?: Omit<UseQueryOptions<Persona[], Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: personaKeys.list(),
		queryFn: () => personasApi.getAll(),
		...options,
	});
}

/**
 * Hook to fetch a single persona by ID
 */
export function usePersona(
	id: string,
	options?: Omit<UseQueryOptions<Persona, Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: personaKeys.detail(id),
		queryFn: () => personasApi.getById(id),
		enabled: !!id,
		...options,
	});
}

/**
 * Hook to create a new persona
 */
export function useCreatePersona(
	options?: UseMutationOptions<Persona, Error, CreatePersonaInput>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreatePersonaInput) => personasApi.create(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: personaKeys.lists() });
		},
		...options,
	});
}

/**
 * Hook to update a persona
 */
export function useUpdatePersona(
	options?: UseMutationOptions<
		Persona,
		Error,
		{ id: string; input: UpdatePersonaInput }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdatePersonaInput }) =>
			personasApi.update(id, input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: personaKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: personaKeys.detail(variables.id),
			});
		},
		...options,
	});
}

/**
 * Hook to delete a persona
 */
export function useDeletePersona(
	options?: UseMutationOptions<void, Error, string>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => personasApi.delete(id),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: personaKeys.lists() });
			queryClient.removeQueries({ queryKey: personaKeys.detail(id) });
		},
		...options,
	});
}
