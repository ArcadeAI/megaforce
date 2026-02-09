/**
 * Error Handler Middleware
 * Global error handling for the Elysia application
 */

export interface ErrorResponse {
	error: string;
	message: string;
	statusCode: number;
	timestamp: string;
	path?: string;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
	constructor(
		message: string,
		public statusCode = 500,
		public code?: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

/**
 * Format error response
 */
function formatErrorResponse(
	error: Error,
	statusCode: number,
	path?: string,
): ErrorResponse {
	return {
		error: error.name || "Error",
		message: error.message || "An unexpected error occurred",
		statusCode,
		timestamp: new Date().toISOString(),
		...(path && { path }),
	};
}

/**
 * Global error handler for Elysia
 * Handles different error types and returns appropriate responses
 */
export function handleError(error: Error, context?: { request?: Request }) {
	console.error("Error occurred:", {
		name: error.name,
		message: error.message,
		stack: error.stack,
		path: context?.request?.url,
	});

	// Handle custom application errors
	if (error instanceof AppError) {
		return Response.json(
			formatErrorResponse(error, error.statusCode, context?.request?.url),
			{
				status: error.statusCode,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	// Handle validation errors (Elysia/TypeBox)
	if (error.name === "ValidationError") {
		return Response.json(
			formatErrorResponse(error, 400, context?.request?.url),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	// Handle Prisma errors
	if (error.name === "PrismaClientKnownRequestError") {
		return Response.json(
			formatErrorResponse(
				new Error("Database error occurred"),
				500,
				context?.request?.url,
			),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	// Handle generic errors (500 Internal Server Error)
	return Response.json(
		formatErrorResponse(
			new Error("Internal server error"),
			500,
			context?.request?.url,
		),
		{
			status: 500,
			headers: { "Content-Type": "application/json" },
		},
	);
}
