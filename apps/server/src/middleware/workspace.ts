/**
 * Workspace Middleware
 * Injects workspace context for authenticated users
 */

import prisma from "@megaforce/db";
import type { AuthenticatedUser } from "./auth";

export interface WorkspaceContext {
	id: string;
	name: string;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Get user's workspace (currently returns first workspace)
 * In the future, this could be enhanced to:
 * - Accept workspace ID from headers/query params
 * - Support multi-workspace users
 * - Cache workspace lookups
 */
export async function getUserWorkspace(
	userId: string,
): Promise<WorkspaceContext | null> {
	try {
		let workspace = await prisma.workspace.findFirst({
			where: { userId },
			select: {
				id: true,
				name: true,
				userId: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!workspace) {
			workspace = await prisma.workspace.create({
				data: {
					name: "My Workspace",
					userId,
				},
				select: {
					id: true,
					name: true,
					userId: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		}

		return workspace;
	} catch (error) {
		console.error("Error fetching workspace:", error);
		return null;
	}
}

/**
 * Middleware to inject workspace context
 * Requires authentication middleware to run first
 * Returns 404 if user has no workspace
 */
export async function requireWorkspace(user: AuthenticatedUser) {
	const workspace = await getUserWorkspace(user.id);

	if (!workspace) {
		return new Response(
			JSON.stringify({
				error: "Not Found",
				message: "No workspace found for user",
			}),
			{
				status: 404,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	return workspace;
}
