import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PersonaForm } from "@/components/persona-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTabs } from "@/contexts/tab-context";
import { authClient } from "@/lib/auth-client";
import { useDeletePersona, usePersona } from "@/lib/hooks/use-personas";

export const Route = createFileRoute("/personas/$personaId")({
	component: PersonaDetailPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

function PersonaDetailPage() {
	const { personaId } = Route.useParams();
	const { data: persona, isLoading } = usePersona(personaId);
	const deletePersona = useDeletePersona();
	const navigate = useNavigate();
	const { closeTab, updateTab } = useTabs();
	const [confirmDelete, setConfirmDelete] = useState(false);

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl space-y-6 p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!persona) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground text-sm">Persona not found.</p>
			</div>
		);
	}

	const handleDelete = () => {
		deletePersona.mutate(personaId, {
			onSuccess: () => {
				toast.success("Persona deleted");
				closeTab(`persona-${personaId}`);
				navigate({ to: "/personas" });
			},
			onError: (err) => {
				toast.error(err.message);
			},
		});
	};

	return (
		<div className="mx-auto max-w-2xl space-y-8 p-6">
			<div>
				<h1 className="text-lg font-semibold">{persona.name}</h1>
				{persona.isDefault && (
					<span className="bg-primary/20 text-primary mt-1 inline-block rounded-sm px-1.5 py-0.5 text-xs">
						Default persona
					</span>
				)}
			</div>

			<PersonaForm
				persona={persona}
				onSuccess={(updated) => {
					updateTab(`persona-${personaId}`, { title: updated.name });
				}}
			/>

			{!persona.isDefault && (
				<div className="border-border border-t pt-6">
					{confirmDelete ? (
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-xs">
								Are you sure?
							</span>
							<Button
								variant="outline"
								className="text-red-500 hover:text-red-600"
								onClick={handleDelete}
								disabled={deletePersona.isPending}
							>
								{deletePersona.isPending ? "Deleting..." : "Confirm Delete"}
							</Button>
							<Button
								variant="ghost"
								onClick={() => {
									setConfirmDelete(false);
								}}
							>
								Cancel
							</Button>
						</div>
					) : (
						<Button
							variant="outline"
							className="text-red-500 hover:text-red-600"
							onClick={() => {
								setConfirmDelete(true);
							}}
						>
							Delete Persona
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
