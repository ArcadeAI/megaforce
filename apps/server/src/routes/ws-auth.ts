/**
 * WebSocket Authentication Token Route
 * Provides short-lived tokens for WebSocket authentication
 */

import { randomBytes } from "node:crypto";
import { auth } from "@megaforce/auth";
import { Elysia } from "elysia";

// Store active tokens (in production, use Redis)
const wsTokens = new Map<
	string,
	{ userId: string; expiresAt: number; email: string }
>();

// Clean up expired tokens every 5 minutes
setInterval(
	() => {
		const now = Date.now();
		for (const [token, data] of wsTokens.entries()) {
			if (data.expiresAt < now) {
				wsTokens.delete(token);
			}
		}
	},
	5 * 60 * 1000,
);

export const wsAuthRoutes = new Elysia().get(
	"/api/ws-token",
	async ({ request }) => {
		try {
			// Verify session using Better Auth
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			if (!session?.user?.id) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Generate a random token
			const token = randomBytes(32).toString("hex");

			// Store token with 5-minute expiration
			wsTokens.set(token, {
				userId: session.user.id,
				email: session.user.email,
				expiresAt: Date.now() + 5 * 60 * 1000,
			});

			return {
				token,
				expiresIn: 300, // 5 minutes in seconds
			};
		} catch (error) {
			console.error("Error generating WS token:", error);
			return new Response(
				JSON.stringify({ error: "Failed to generate token" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	},
);

/**
 * Verify a WebSocket token and return user info
 */
export function verifyWsToken(
	token: string,
): { userId: string; email: string } | null {
	const data = wsTokens.get(token);

	if (!data) {
		return null;
	}

	// Check if token is expired
	if (data.expiresAt < Date.now()) {
		wsTokens.delete(token);
		return null;
	}

	return {
		userId: data.userId,
		email: data.email,
	};
}
