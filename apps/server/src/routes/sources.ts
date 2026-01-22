/**
 * Source Routes
 * Handles source data management operations
 */

import { Elysia, t } from "elysia";

export const sourcesRoutes = new Elysia({ prefix: "/api/sources" })
	.get("/", () => {
		return {
			success: true,
			data: [],
			message: "Sources list endpoint - not implemented",
		};
	})
	.get("/:id", ({ params }) => {
		return {
			success: true,
			data: { id: params.id },
			message: "Source detail endpoint - not implemented",
		};
	})
	.post(
		"/",
		({ body }) => {
			return {
				success: true,
				data: body,
				message: "Create source endpoint - not implemented",
			};
		},
		{
			body: t.Object({
				type: t.String(),
				url: t.String(),
			}),
		},
	)
	.delete("/:id", ({ params }) => {
		return {
			success: true,
			data: { id: params.id },
			message: "Delete source endpoint - not implemented",
		};
	});
