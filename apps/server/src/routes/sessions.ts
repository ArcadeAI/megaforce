/**
 * Session Routes
 * CRUD operations for content sessions
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";

import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";

export const sessionsRoutes = new Elysia({ prefix: "/api/sessions" })
	.derive(async (context) => {
		const user = await requireAuth(context);
		if (user instanceof Response) {
			return { user: null, workspace: null };
		}
		const workspace = await requireWorkspace(user);
		if (workspace instanceof Response) {
			return { user, workspace: null };
		}
		return { user, workspace };
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
		if (!context.workspace) {
			return Response.json(
				{ error: "No workspace found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	})
	// List sessions (with optional search)
	.get("/", async (context) => {
		const q = context.query?.q?.trim();
		const sessions = await prisma.contentSession.findMany({
			where: {
				workspaceId: context.workspace!.id,
				...(q && { title: { contains: q, mode: "insensitive" as const } }),
			},
			orderBy: { updatedAt: "desc" },
			include: {
				sessionPersonas: { include: { persona: true } },
				_count: {
					select: { plans: true, outlines: true, generatedContent: true },
				},
			},
		});
		return { success: true, data: sessions };
	})
	// Get session by ID
	.get("/:id", async (context) => {
		const session = await prisma.contentSession.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
			},
			include: {
				sessionPersonas: { include: { persona: true } },
				sessionSources: { include: { source: true } },
				plans: { orderBy: { version: "desc" }, take: 1 },
				outlines: { orderBy: { version: "desc" }, take: 1 },
				generatedContent: { orderBy: { version: "desc" }, take: 1 },
			},
		});
		if (!session) {
			return Response.json(
				{ error: "Session not found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		return { success: true, data: session };
	})
	// Create session
	.post(
		"/",
		async (context) => {
			const session = await prisma.contentSession.create({
				data: {
					workspaceId: context.workspace!.id,
					title: context.body.title,
				},
			});
			return { success: true, data: session };
		},
		{
			body: t.Object({
				title: t.String(),
			}),
		},
	)
	// Update session
	.patch(
		"/:id",
		async (context) => {
			const existing = await prisma.contentSession.findFirst({
				where: { id: context.params.id, workspaceId: context.workspace!.id },
			});
			if (!existing) {
				return Response.json(
					{ error: "Session not found" },
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			const session = await prisma.contentSession.update({
				where: { id: context.params.id },
				data: {
					...(context.body.title !== undefined && {
						title: context.body.title,
					}),
					...(context.body.outputTypes !== undefined && {
						outputTypes: context.body.outputTypes,
					}),
					...(context.body.clarifyingAnswers !== undefined && {
						clarifyingAnswers: context.body.clarifyingAnswers,
					}),
					...(context.body.dataSourceMode !== undefined && {
						dataSourceMode: context.body.dataSourceMode,
					}),
				},
			});
			return { success: true, data: session };
		},
		{
			body: t.Object({
				title: t.Optional(t.String()),
				outputTypes: t.Optional(t.Any()),
				clarifyingAnswers: t.Optional(t.Any()),
				dataSourceMode: t.Optional(
					t.Union([
						t.Literal("CORPUS_ONLY"),
						t.Literal("DEEP_RESEARCH"),
						t.Literal("BOTH"),
					]),
				),
			}),
		},
	)
	// Delete session
	.delete("/:id", async (context) => {
		const existing = await prisma.contentSession.findFirst({
			where: { id: context.params.id, workspaceId: context.workspace!.id },
		});
		if (!existing) {
			return Response.json(
				{ error: "Session not found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		await prisma.contentSession.delete({ where: { id: context.params.id } });
		return { success: true, data: { id: context.params.id } };
	})
	// Duplicate session (copies stages 1-3 config into a new session)
	.post("/:id/duplicate", async (context) => {
		const existing = await prisma.contentSession.findFirst({
			where: { id: context.params.id, workspaceId: context.workspace!.id },
			include: {
				sessionPersonas: true,
				sessionSources: true,
			},
		});
		if (!existing) {
			return Response.json(
				{ error: "Session not found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const session = await prisma.contentSession.create({
			data: {
				workspaceId: context.workspace!.id,
				title: `${existing.title} (copy)`,
				outputTypes: existing.outputTypes ?? undefined,
				clarifyingAnswers: existing.clarifyingAnswers ?? undefined,
				dataSourceMode: existing.dataSourceMode,
				currentStage: "OUTPUT_SELECTION",
				status: "ACTIVE",
				sessionPersonas: {
					create: existing.sessionPersonas.map((sp) => ({
						personaId: sp.personaId,
					})),
				},
				sessionSources: {
					create: existing.sessionSources.map((ss) => ({
						sourceId: ss.sourceId,
					})),
				},
			},
			include: {
				sessionPersonas: { include: { persona: true } },
				sessionSources: { include: { source: true } },
			},
		});
		return { success: true, data: session };
	})
	// Archive session
	.post("/:id/archive", async (context) => {
		const existing = await prisma.contentSession.findFirst({
			where: { id: context.params.id, workspaceId: context.workspace!.id },
		});
		if (!existing) {
			return Response.json(
				{ error: "Session not found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { status: "ARCHIVED" },
		});
		return { success: true, data: session };
	})
	// Unarchive session
	.post("/:id/unarchive", async (context) => {
		const existing = await prisma.contentSession.findFirst({
			where: { id: context.params.id, workspaceId: context.workspace!.id },
		});
		if (!existing) {
			return Response.json(
				{ error: "Session not found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { status: "ACTIVE" },
		});
		return { success: true, data: session };
	});
