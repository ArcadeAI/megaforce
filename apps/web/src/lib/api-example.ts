// Example usage of the Eden Treaty client for end-to-end type safety
// This file demonstrates how to use the api client with full TypeScript support

import { api } from "./api";

// Example: Calling the root endpoint
// The return type and parameters are fully typed based on the backend Elysia app
export async function exampleGetRoot() {
	const { data, error } = await api.index.get();

	if (error) {
		console.error("Error fetching root:", error);
		return;
	}

	// data is typed as "OK" based on the backend implementation
	console.log("Root response:", data);
	return data;
}

// Example: You can add more endpoint calls here as your backend grows
// The TypeScript compiler will ensure:
// 1. You only call endpoints that exist on the backend
// 2. You pass the correct parameters with the right types
// 3. You handle the response with the correct return types
