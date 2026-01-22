/**
 * Upload Routes
 * Handles file upload operations
 */

import { Elysia, t } from "elysia";

export const uploadRoutes = new Elysia({ prefix: "/api/upload" })
	.post(
		"/image",
		() => {
			return {
				success: true,
				data: {
					url: "https://placeholder.com/image.jpg",
					type: "image",
				},
				message: "Image upload endpoint - not implemented",
			};
		},
		{
			body: t.Object({
				file: t.Any(),
			}),
		},
	)
	.post(
		"/video",
		() => {
			return {
				success: true,
				data: {
					url: "https://placeholder.com/video.mp4",
					type: "video",
				},
				message: "Video upload endpoint - not implemented",
			};
		},
		{
			body: t.Object({
				file: t.Any(),
			}),
		},
	)
	.post(
		"/document",
		() => {
			return {
				success: true,
				data: {
					url: "https://placeholder.com/document.pdf",
					type: "document",
				},
				message: "Document upload endpoint - not implemented",
			};
		},
		{
			body: t.Object({
				file: t.Any(),
			}),
		},
	)
	.delete("/:id", ({ params }) => {
		return {
			success: true,
			data: { id: params.id },
			message: "Delete upload endpoint - not implemented",
		};
	});
