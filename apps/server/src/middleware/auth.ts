/**
 * Authentication Middleware
 * Validates user session and injects authenticated user into context
 */

import { auth } from "@megaforce/auth";
import type { Context } from "elysia";

export interface AuthenticatedUser {
	id: string;
	email: string;
	name: string;
	emailVerified: boolean;
}

/**
 * Authenticate a request and extract user from session
 * Returns null if authentication fails
 */
export async function authenticateRequest(
	request: Request,
): Promise<AuthenticatedUser | null> {
	try {
		// Get session from request (better-auth will extract from cookies)
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return null;
		}

		return {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name,
			emailVerified: session.user.emailVerified,
		};
	} catch (error) {
		console.error("Authentication error:", error);
		return null;
	}
}

/**
 * Middleware to require authentication on routes
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(context: Context) {
	const user = await authenticateRequest(context.request);

	if (!user) {
		return Response.json(
			{
				error: "Unauthorized",
				message: "Authentication required",
			},
			{
				status: 401,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	return user;
}
