/**
 * Generation Routes
 * Handles content generation, approval, section regeneration, and export
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";

import { contentGenerationQueue } from "../jobs/queue";
import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";

export const generationRoutes = new Elysia({ prefix: "/api/sessions" })
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
	// Trigger content generation
	.post("/:id/content", async (context) => {
		const session = await prisma.contentSession.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
				currentStage: "GENERATION",
			},
		});
		if (!session) {
			return Response.json(
				{
					error: "Session not found or not in GENERATION stage",
				},
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}

		const outline = await prisma.outline.findFirst({
			where: { sessionId: session.id, status: "USER_APPROVED" },
			orderBy: { version: "desc" },
		});
		if (!outline) {
			return Response.json(
				{ error: "No approved outline found" },
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Check if there's already a DRAFT/CRITIC_REVIEWING content
		const existing = await prisma.generatedContent.findFirst({
			where: {
				sessionId: session.id,
				status: { in: ["DRAFT", "CRITIC_REVIEWING"] },
			},
		});
		if (existing) {
			return { success: true, data: existing };
		}

		// Create placeholder
		const latestContent = await prisma.generatedContent.findFirst({
			where: { sessionId: session.id, outlineId: outline.id },
			orderBy: { version: "desc" },
		});
		const content = await prisma.generatedContent.create({
			data: {
				sessionId: session.id,
				outlineId: outline.id,
				version: (latestContent?.version ?? 0) + 1,
				content: "",
				sections: [],
				status: "DRAFT",
				criticIterations: 0,
				metrics: {},
			},
		});

		await contentGenerationQueue.add("generate-content", {
			sessionId: session.id,
			outlineId: outline.id,
			contentId: content.id,
		});

		return {
			success: true,
			data: content,
		};
	})
	// Get latest content
	.get("/:id/content", async (context) => {
		const content = await prisma.generatedContent.findFirst({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			},
			orderBy: { version: "desc" },
			include: {
				outline: true,
			},
		});
		return { success: true, data: content };
	})
	// Approve content (marks session COMPLETED)
	.post("/:id/content/approve", async (context) => {
		const content = await prisma.generatedContent.findFirst({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			},
			orderBy: { version: "desc" },
		});
		if (!content) {
			return Response.json(
				{ error: "No content found" },
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		await prisma.generatedContent.update({
			where: { id: content.id },
			data: { status: "USER_APPROVED" },
		});
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { currentStage: "COMPLETE", status: "COMPLETED" },
		});

		return { success: true, data: { content, session } };
	})
	// Edit content
	.post(
		"/:id/content/edit",
		async (context) => {
			const latestContent = await prisma.generatedContent.findFirst({
				where: {
					session: {
						id: context.params.id,
						workspaceId: context.workspace!.id,
					},
				},
				orderBy: { version: "desc" },
			});
			if (!latestContent) {
				return Response.json(
					{ error: "No content found" },
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const content = await prisma.generatedContent.create({
				data: {
					sessionId: context.params.id,
					outlineId: latestContent.outlineId,
					version: latestContent.version + 1,
					content: context.body.content,
					sections: context.body.sections ?? latestContent.sections,
					status: "USER_APPROVED",
				},
			});
			return { success: true, data: content };
		},
		{
			body: t.Object({
				content: t.String(),
				sections: t.Optional(t.Any()),
			}),
		},
	)
	// Reject content
	.post("/:id/content/reject", async (context) => {
		const session = await prisma.contentSession.update({
			where: { id: context.params.id },
			data: { currentStage: "OUTLINE" },
		});
		return { success: true, data: session };
	})
	// Request changes
	.post(
		"/:id/content/request-changes",
		async (context) => {
			const outline = await prisma.outline.findFirst({
				where: { sessionId: context.params.id, status: "USER_APPROVED" },
				orderBy: { version: "desc" },
			});
			if (!outline) {
				return Response.json(
					{ error: "No approved outline found" },
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			await contentGenerationQueue.add("regenerate-content", {
				sessionId: context.params.id,
				outlineId: outline.id,
			});
			return {
				success: true,
				data: { message: "Content regeneration started" },
			};
		},
		{
			body: t.Object({
				feedback: t.String(),
			}),
		},
	)
	// Regenerate specific section
	.post(
		"/:id/content/regenerate-section",
		async (context) => {
			const outline = await prisma.outline.findFirst({
				where: { sessionId: context.params.id, status: "USER_APPROVED" },
				orderBy: { version: "desc" },
			});
			if (!outline) {
				return Response.json(
					{ error: "No approved outline found" },
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			await contentGenerationQueue.add("regenerate-section", {
				sessionId: context.params.id,
				outlineId: outline.id,
			});
			return {
				success: true,
				data: { message: "Section regeneration started" },
			};
		},
		{
			body: t.Object({
				sectionIndex: t.Number(),
				feedback: t.Optional(t.String()),
			}),
		},
	)
	// Export as Markdown
	.get("/:id/export/markdown", async (context) => {
		const content = await prisma.generatedContent.findFirst({
			where: {
				session: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
				status: "USER_APPROVED",
			},
			orderBy: { version: "desc" },
			include: {
				session: true,
			},
		});
		if (!content) {
			return Response.json(
				{ error: "No approved content found" },
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(content.content, {
			headers: {
				"Content-Type": "text/markdown",
				"Content-Disposition": `attachment; filename="${content.session.title.replaceAll(/[^\w- ]/g, "")}.md"`,
			},
		});
	});
