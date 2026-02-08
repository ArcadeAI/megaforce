/**
 * Outline Routes
 * Handles outline generation, approval, rejection, and editing
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";
import { outlineGenerationQueue } from "../jobs/queue";
import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";

export const outlinesRoutes = new Elysia({ prefix: "/api/sessions" })
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
	// Generate outline
	.post("/:id/outline", async (context) => {
		const session = await prisma.contentSession.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
				currentStage: "OUTLINE",
			},
		});
		if (!session) {
			return new Response(
				JSON.stringify({
					error: "Session not found or not in OUTLINE stage",
				}),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}

		const plan = await prisma.plan.findFirst({
			where: { sessionId: session.id, status: "USER_APPROVED" },
			orderBy: { version: "desc" },
		});
		if (!plan) {
			return new Response(JSON.stringify({ error: "No approved plan found" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Check if there's already a DRAFT/CRITIC_REVIEWING outline
		const existing = await prisma.outline.findFirst({
			where: {
				sessionId: session.id,
				status: { in: ["DRAFT", "CRITIC_REVIEWING"] },
			},
		});
		if (existing) {
			return {
				success: true,
				data: { outline: existing, knowledgeBase: null },
			};
		}

		// Create placeholder
		const latestOutline = await prisma.outline.findFirst({
			where: { sessionId: session.id },
			orderBy: { version: "desc" },
		});
		const outline = await prisma.outline.create({
			data: {
				sessionId: session.id,
				planId: plan.id,
				version: (latestOutline?.version ?? 0) + 1,
				content: {},
				status: "DRAFT",
				criticIterations: 0,
			},
		});

		await outlineGenerationQueue.add("generate-outline", {
			sessionId: session.id,
			planId: plan.id,
			outlineId: outline.id,
		});

		return {
			success: true,
			data: { outline, knowledgeBase: null },
		};
	})
	// Get latest outline + KB overview
	.get("/:id/outline", async (context) => {
		const outline = await prisma.outline.findFirst({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			},
			orderBy: { version: "desc" },
		});
		const kb = await prisma.knowledgeBase.findFirst({
			where: { sessionId: context.params.id },
			include: { entries: { orderBy: { relevanceScore: "desc" } } },
		});
		return { success: true, data: { outline, knowledgeBase: kb } };
	})
	// Approve outline (advances to GENERATION stage)
	.post("/:id/outline/approve", async (context) => {
		const outline = await prisma.outline.findFirst({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			},
			orderBy: { version: "desc" },
		});
		if (!outline) {
			return new Response(JSON.stringify({ error: "No outline found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await prisma.outline.update({
			where: { id: outline.id },
			data: { status: "USER_APPROVED" },
		});
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { currentStage: "GENERATION" },
		});

		return { success: true, data: { outline, session } };
	})
	// Edit outline (saves as new version)
	.post(
		"/:id/outline/edit",
		async (context) => {
			const latestOutline = await prisma.outline.findFirst({
				where: {
					session: {
						id: context.params.id,
						workspaceId: context.workspace!.id,
					},
				},
				orderBy: { version: "desc" },
			});
			if (!latestOutline) {
				return new Response(JSON.stringify({ error: "No outline found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});
			}

			const outline = await prisma.outline.create({
				data: {
					sessionId: context.params.id,
					planId: latestOutline.planId,
					version: latestOutline.version + 1,
					content: context.body.content,
					status: "USER_APPROVED",
				},
			});
			return { success: true, data: outline };
		},
		{
			body: t.Object({
				content: t.Any(),
			}),
		},
	)
	// Reject outline
	.post("/:id/outline/reject", async (context) => {
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { currentStage: "PLAN" },
		});
		return { success: true, data: session };
	})
	// Request changes
	.post(
		"/:id/outline/request-changes",
		async (context) => {
			const plan = await prisma.plan.findFirst({
				where: { sessionId: context.params.id, status: "USER_APPROVED" },
				orderBy: { version: "desc" },
			});
			if (!plan) {
				return new Response(
					JSON.stringify({ error: "No approved plan found" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			await outlineGenerationQueue.add("regenerate-outline", {
				sessionId: context.params.id,
				planId: plan.id,
			});
			return {
				success: true,
				data: { message: "Outline regeneration started with feedback" },
			};
		},
		{
			body: t.Object({
				feedback: t.String(),
			}),
		},
	);
