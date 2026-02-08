import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { type Persona, personasApi } from "../api/personas";

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
 * Hook to fetch personas for the current workspace
 * (workspace is auto-detected from auth on the server)
 */
export function usePersonas(
	workspaceId?: string,
	options?: Omit<UseQueryOptions<Persona[], Error>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: personaKeys.list(),
		queryFn: () => personasApi.getAll(),
		enabled: !!workspaceId,
		...options,
	});
}
