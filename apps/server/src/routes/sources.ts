/**
 * Source Routes
 * Handles source data management — create (text/URL), list, delete
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";

export const sourcesRoutes = new Elysia({ prefix: "/api/sources" })
	.derive(async (context) => {
		const user = await requireAuth(context);
		if (user instanceof Response) return { user: null, workspace: null };
		const workspace = await requireWorkspace(user);
		if (workspace instanceof Response) return { user, workspace: null };
		return { user, workspace };
	})
	.onBeforeHandle((context) => {
		if (!context.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		if (!context.workspace) {
			return new Response(JSON.stringify({ error: "No workspace found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
	})
	// List sources
	.get("/", async (context) => {
		const sources = await prisma.source.findMany({
			where: { workspaceId: context.workspace!.id },
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: sources };
	})
	// Get source by ID
	.get("/:id", async (context) => {
		const source = await prisma.source.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
			},
		});
		if (!source) {
			return new Response(JSON.stringify({ error: "Source not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		return { success: true, data: source };
	})
	// Create source
	.post(
		"/",
		async (context) => {
			const source = await prisma.source.create({
				data: {
					workspaceId: context.workspace!.id,
					type: context.body.type as "URL" | "TEXT" | "PDF",
					title: context.body.title,
					url: context.body.url,
					content: context.body.content,
				},
			});
			return { success: true, data: source };
		},
		{
			body: t.Object({
				type: t.Union([t.Literal("URL"), t.Literal("TEXT"), t.Literal("PDF")]),
				title: t.String(),
				url: t.Optional(t.String()),
				content: t.Optional(t.String()),
			}),
		},
	)
	// Delete source
	.delete("/:id", async (context) => {
		const existing = await prisma.source.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
			},
		});
		if (!existing) {
			return new Response(JSON.stringify({ error: "Source not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		await prisma.source.delete({ where: { id: context.params.id } });
		return { success: true, data: { id: context.params.id } };
	});
