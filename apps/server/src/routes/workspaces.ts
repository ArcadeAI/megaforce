/**
 * Workspace Routes
 * Handles workspace management operations
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";

import { requireAuth } from "../middleware/auth";

export const workspacesRoutes = new Elysia({ prefix: "/api/workspaces" })
	.derive(async (context) => {
		const user = await requireAuth(context);
		if (user instanceof Response) {
			return { user: null };
		}
		return { user };
	})
	.onBeforeHandle((context) => {
		if (!context.user) {
			return Response.json(
				{ error: "Unauthorized" },
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	})
	// List user's workspaces
	.get("/", async (context) => {
		const workspaces = await prisma.workspace.findMany({
			where: { userId: context.user!.id },
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: workspaces };
	})
	// Get workspace by ID
	.get("/:id", async (context) => {
		const workspace = await prisma.workspace.findFirst({
			where: { id: context.params.id, userId: context.user!.id },
		});
		if (!workspace) {
			return Response.json(
				{ error: "Workspace not found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		return { success: true, data: workspace };
	})
	// Create workspace
	.post(
		"/",
		async (context) => {
			const workspace = await prisma.workspace.create({
				data: {
					name: context.body.name,
					userId: context.user!.id,
				},
			});
			return { success: true, data: workspace };
		},
		{
			body: t.Object({
				name: t.String(),
			}),
		},
	)
	// Update workspace
	.patch(
		"/:id",
		async (context) => {
			const existing = await prisma.workspace.findFirst({
				where: { id: context.params.id, userId: context.user!.id },
			});
			if (!existing) {
				return Response.json(
					{ error: "Workspace not found" },
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			const workspace = await prisma.workspace.update({
				where: { id: context.params.id },
				data: { name: context.body.name },
			});
			return { success: true, data: workspace };
		},
		{
			body: t.Object({
				name: t.Optional(t.String()),
			}),
		},
	);
