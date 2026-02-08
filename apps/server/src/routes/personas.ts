/**
 * Persona Routes
 * Handles persona CRUD operations
 */

import prisma from "@megaforce/db";
import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";

export const personasRoutes = new Elysia({ prefix: "/api/personas" })
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
	// List personas
	.get("/", async (context) => {
		const personas = await prisma.persona.findMany({
			where: { workspaceId: context.workspace!.id },
			orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
		});

		// If no personas exist, seed the default one
		if (personas.length === 0) {
			const defaultPersona = await prisma.persona.create({
				data: {
					workspaceId: context.workspace!.id,
					name: "Neutral Professional",
					description:
						"A balanced, professional voice suitable for most content types. Clear, informative, and engaging without being overly casual or formal.",
					styleProfile: {
						tone: "professional",
						formality: "moderate",
						humor: "minimal",
					},
					vocabularyLevel: "intermediate",
					perspective: "third-person",
					sentenceStyle: "varied",
					isDefault: true,
				},
			});
			return { success: true, data: [defaultPersona] };
		}

		return { success: true, data: personas };
	})
	// Get persona by ID
	.get("/:id", async (context) => {
		const persona = await prisma.persona.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
			},
		});
		if (!persona) {
			return new Response(JSON.stringify({ error: "Persona not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		return { success: true, data: persona };
	})
	// Create persona
	.post(
		"/",
		async (context) => {
			const persona = await prisma.persona.create({
				data: {
					workspaceId: context.workspace!.id,
					name: context.body.name,
					description: context.body.description,
					styleProfile: context.body.styleProfile ?? {
						tone: "professional",
						formality: "moderate",
						humor: "minimal",
					},
					vocabularyLevel: context.body.vocabularyLevel,
					perspective: context.body.perspective,
					sentenceStyle: context.body.sentenceStyle,
					sampleOutput: context.body.sampleOutput,
				},
			});
			return { success: true, data: persona };
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.Optional(t.String()),
				styleProfile: t.Optional(t.Any()),
				vocabularyLevel: t.Optional(t.String()),
				perspective: t.Optional(t.String()),
				sentenceStyle: t.Optional(t.String()),
				sampleOutput: t.Optional(t.String()),
			}),
		},
	)
	// Update persona
	.patch(
		"/:id",
		async (context) => {
			const existing = await prisma.persona.findFirst({
				where: {
					id: context.params.id,
					workspaceId: context.workspace!.id,
				},
			});
			if (!existing) {
				return new Response(JSON.stringify({ error: "Persona not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});
			}
			const persona = await prisma.persona.update({
				where: { id: context.params.id },
				data: {
					...(context.body.name !== undefined && { name: context.body.name }),
					...(context.body.description !== undefined && {
						description: context.body.description,
					}),
					...(context.body.styleProfile !== undefined && {
						styleProfile: context.body.styleProfile,
					}),
					...(context.body.vocabularyLevel !== undefined && {
						vocabularyLevel: context.body.vocabularyLevel,
					}),
					...(context.body.perspective !== undefined && {
						perspective: context.body.perspective,
					}),
					...(context.body.sentenceStyle !== undefined && {
						sentenceStyle: context.body.sentenceStyle,
					}),
					...(context.body.sampleOutput !== undefined && {
						sampleOutput: context.body.sampleOutput,
					}),
				},
			});
			return { success: true, data: persona };
		},
		{
			body: t.Object({
				name: t.Optional(t.String()),
				description: t.Optional(t.String()),
				styleProfile: t.Optional(t.Any()),
				vocabularyLevel: t.Optional(t.String()),
				perspective: t.Optional(t.String()),
				sentenceStyle: t.Optional(t.String()),
				sampleOutput: t.Optional(t.String()),
			}),
		},
	)
	// Delete persona
	.delete("/:id", async (context) => {
		const existing = await prisma.persona.findFirst({
			where: {
				id: context.params.id,
				workspaceId: context.workspace!.id,
			},
		});
		if (!existing) {
			return new Response(JSON.stringify({ error: "Persona not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		if (existing.isDefault) {
			return new Response(
				JSON.stringify({ error: "Cannot delete the default persona" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}
		await prisma.persona.delete({ where: { id: context.params.id } });
		return { success: true, data: { id: context.params.id } };
	});
