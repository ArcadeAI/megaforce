/**
 * OpenRouter LLM Client
 * Wrapper for OpenRouter API with retry, JSON mode, and streaming support
 */

import { env } from "@megaforce/env/server";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4";

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface LLMOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	jsonMode?: boolean;
}

interface OpenRouterResponse {
	id: string;
	choices: {
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}[];
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

/**
 * Call OpenRouter chat completions API with retry and backoff
 */
export async function chatCompletion(
	messages: ChatMessage[],
	options: LLMOptions = {},
): Promise<string> {
	const {
		model = DEFAULT_MODEL,
		temperature = 0.7,
		maxTokens = 4096,
		jsonMode = false,
	} = options;

	const body: Record<string, unknown> = {
		model,
		messages,
		temperature,
		max_tokens: maxTokens,
	};

	if (jsonMode) {
		body.response_format = { type: "json_object" };
	}

	let lastError: Error | null = null;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
					"HTTP-Referer": env.BETTER_AUTH_URL,
					"X-Title": "Megaforce",
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorBody = await response.text().catch(() => "");
				throw new Error(
					`OpenRouter API error ${response.status}: ${errorBody}`,
				);
			}

			const data = (await response.json()) as OpenRouterResponse;
			const content = data.choices[0]?.message?.content;

			if (!content) {
				throw new Error("Empty response from OpenRouter");
			}

			return content;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (attempt < 2) {
				const delay = 2 ** attempt * 1000;
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError ?? new Error("LLM call failed after retries");
}

/**
 * Call OpenRouter and parse the response as JSON
 */
export async function chatCompletionJSON<T = Record<string, unknown>>(
	messages: ChatMessage[],
	options: LLMOptions = {},
): Promise<T> {
	const content = await chatCompletion(messages, {
		...options,
		jsonMode: true,
	});

	try {
		return JSON.parse(content) as T;
	} catch {
		// Try extracting JSON from markdown code blocks
		const jsonMatch = /```(?:json)?\s*([\s\S]*?)\n?```/.exec(content);
		if (jsonMatch?.[1]) {
			return JSON.parse(jsonMatch[1]) as T;
		}
		throw new Error(
			`Failed to parse LLM response as JSON: ${content.slice(0, 200)}`,
		);
	}
}
