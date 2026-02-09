/**
 * Session Workflow Routes
 * Handles advancing/retreating through stages and stage-specific data submission
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";

import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";

const STAGE_ORDER = [
	"OUTPUT_SELECTION",
	"CLARIFYING",
	"PERSONA",
	"PLAN",
	"OUTLINE",
	"GENERATION",
	"COMPLETE",
] as const;

type SessionStage = (typeof STAGE_ORDER)[number];

function getStageIndex(stage: string): number {
	return STAGE_ORDER.indexOf(stage as SessionStage);
}

function getNextStage(stage: string): SessionStage | null {
	const index = getStageIndex(stage);
	if (index === -1 || index >= STAGE_ORDER.length - 1) {
		return null;
	}
	return STAGE_ORDER[index + 1] ?? null;
}

function getPreviousStage(stage: string): SessionStage | null {
	const index = getStageIndex(stage);
	if (index <= 0) {
		return null;
	}
	return STAGE_ORDER[index - 1] ?? null;
}

export const sessionWorkflowRoutes = new Elysia({
	prefix: "/api/sessions",
})
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
	// Advance to next stage
	.post(
		"/:id/advance",
		async (context) => {
			const session = await prisma.contentSession.findFirst({
				where: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
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

			const nextStage = getNextStage(session.currentStage);
			if (!nextStage) {
				return Response.json(
					{ error: "Already at final stage" },
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			const stageData = context.body.stageData;

			// Stage-specific validation and persistence
			if (session.currentStage === "OUTPUT_SELECTION") {
				if (
					!stageData?.outputTypes ||
					!Array.isArray(stageData.outputTypes) ||
					stageData.outputTypes.length !== 1
				) {
					return Response.json(
						{
							error: "Exactly one output type must be selected",
						},
						{ status: 400, headers: { "Content-Type": "application/json" } },
					);
				}
				await prisma.contentSession.update({
					where: { id: session.id },
					data: { outputTypes: stageData.outputTypes },
				});
			}

			if (session.currentStage === "CLARIFYING") {
				await prisma.contentSession.update({
					where: { id: session.id },
					data: {
						clarifyingAnswers: stageData?.clarifyingAnswers ?? {},
						dataSourceMode: stageData?.dataSourceMode ?? "CORPUS_ONLY",
					},
				});

				// Create/link sources if provided
				if (stageData?.sources && Array.isArray(stageData.sources)) {
					for (const src of stageData.sources) {
						const source = await prisma.source.create({
							data: {
								workspaceId: context.workspace!.id,
								type: src.type || "URL",
								title: src.title || src.url || "Untitled Source",
								url: src.url,
								content: src.content,
							},
						});
						await prisma.sessionSource.create({
							data: {
								sessionId: session.id,
								sourceId: source.id,
							},
						});
					}
				}
			}

			if (session.currentStage === "PERSONA") {
				if (
					!stageData?.personaIds ||
					!Array.isArray(stageData.personaIds) ||
					stageData.personaIds.length === 0
				) {
					return Response.json(
						{
							error: "At least one persona must be selected",
						},
						{ status: 400, headers: { "Content-Type": "application/json" } },
					);
				}
				// Remove old session personas and add new ones
				await prisma.sessionPersona.deleteMany({
					where: { sessionId: session.id },
				});
				for (let i = 0; i < stageData.personaIds.length; i++) {
					await prisma.sessionPersona.create({
						data: {
							sessionId: session.id,
							personaId: stageData.personaIds[i],
							role: i === 0 ? "PRIMARY" : "SECONDARY",
						},
					});
				}
			}

			const updated = await prisma.contentSession.update({
				where: { id: session.id },
				data: { currentStage: nextStage },
				include: {
					sessionPersonas: { include: { persona: true } },
					sessionSources: { include: { source: true } },
				},
			});

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				stageData: t.Optional(t.Any()),
			}),
		},
	)
	// Go back to previous stage
	.post("/:id/back", async (context) => {
		const session = await prisma.contentSession.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
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

		const prevStage = getPreviousStage(session.currentStage);
		if (!prevStage) {
			return Response.json(
				{ error: "Already at first stage" },
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const updated = await prisma.contentSession.update({
			where: { id: session.id },
			data: { currentStage: prevStage },
		});

		return { success: true, data: updated };
	});
