/**
 * Plan Routes
 * Handles plan generation, approval, rejection, and editing
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";

import { planGenerationQueue } from "../jobs/queue";
import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";

export const plansRoutes = new Elysia({ prefix: "/api/sessions" })
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
	// Generate plan
	.post("/:id/plan", async (context) => {
		const session = await prisma.contentSession.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
				currentStage: "PLAN",
			},
		});
		if (!session) {
			return Response.json(
				{ error: "Session not found or not in PLAN stage" },
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}

		// Check if there's already a DRAFT/CRITIC_REVIEWING plan (prevent double-submit)
		const existing = await prisma.plan.findFirst({
			where: {
				sessionId: session.id,
				status: { in: ["DRAFT", "CRITIC_REVIEWING"] },
			},
		});
		if (existing) {
			return { success: true, data: existing };
		}

		// Create placeholder so the UI can poll for it immediately
		const latestPlan = await prisma.plan.findFirst({
			where: { sessionId: session.id },
			orderBy: { version: "desc" },
		});
		const plan = await prisma.plan.create({
			data: {
				sessionId: session.id,
				version: (latestPlan?.version ?? 0) + 1,
				content: {},
				status: "DRAFT",
				criticIterations: 0,
			},
		});

		await planGenerationQueue.add("generate-plan", {
			sessionId: session.id,
			planId: plan.id,
		});

		return { success: true, data: plan };
	})
	// Get latest plan
	.get("/:id/plan", async (context) => {
		const plan = await prisma.plan.findFirst({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			},
			orderBy: { version: "desc" },
		});
		return { success: true, data: plan };
	})
	// Get plan history
	.get("/:id/plan/history", async (context) => {
		const plans = await prisma.plan.findMany({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			},
			orderBy: { version: "desc" },
		});
		return { success: true, data: plans };
	})
	// Approve plan (advances to OUTLINE stage)
	.post("/:id/plan/approve", async (context) => {
		const plan = await prisma.plan.findFirst({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			},
			orderBy: { version: "desc" },
		});
		if (!plan) {
			return Response.json(
				{ error: "No plan found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		await prisma.plan.update({
			where: { id: plan.id },
			data: { status: "USER_APPROVED" },
		});
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { currentStage: "OUTLINE" },
		});

		return { success: true, data: { plan, session } };
	})
	// Reject plan (go back)
	.post("/:id/plan/reject", async (context) => {
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { currentStage: "PERSONA" },
		});
		return { success: true, data: session };
	})
	// Edit plan (saves as new version)
	.post(
		"/:id/plan/edit",
		async (context) => {
			const latestPlan = await prisma.plan.findFirst({
				where: {
					session: {
						id: context.params.id,
						workspaceId: context.workspace!.id,
					},
				},
				orderBy: { version: "desc" },
			});
			if (!latestPlan) {
				return Response.json(
					{ error: "No plan found" },
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const plan = await prisma.plan.create({
				data: {
					sessionId: context.params.id,
					version: latestPlan.version + 1,
					content: context.body.content,
					status: "USER_APPROVED",
				},
			});
			return { success: true, data: plan };
		},
		{
			body: t.Object({
				content: t.Any(),
			}),
		},
	)
	// Request changes (user feedback triggers re-generation + critic)
	.post(
		"/:id/plan/request-changes",
		async (context) => {
			await planGenerationQueue.add("regenerate-plan", {
				sessionId: context.params.id,
			});
			return {
				success: true,
				data: { message: "Plan regeneration started with feedback" },
			};
		},
		{
			body: t.Object({
				feedback: t.String(),
			}),
		},
	);
