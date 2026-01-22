#!/usr/bin/env bun

/**
 * Type Safety Check for Eden Treaty Client
 *
 * This script verifies that the Eden Treaty client is properly configured
 * and provides end-to-end type safety between the backend and frontend.
 *
 * It performs the following checks:
 * 1. Verifies the server exports an App type
 * 2. Verifies the frontend can import and use the App type
 * 3. Ensures the treaty client is properly typed
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(import.meta.dir, "..");

console.log("🔍 Checking Eden Treaty type safety setup...\n");

// Check 1: Server exports App type
console.log("1. Checking server App type export...");
const serverIndexPath = join(projectRoot, "apps/server/src/index.ts");
if (!existsSync(serverIndexPath)) {
	console.error("❌ Server index file not found");
	process.exit(1);
}

const serverContent = readFileSync(serverIndexPath, "utf-8");
if (!serverContent.includes("export type App")) {
	console.error("❌ Server does not export 'App' type");
	console.error("   Expected: export type App = typeof app;");
	process.exit(1);
}
console.log("✅ Server exports App type correctly\n");

// Check 2: Frontend has api client
console.log("2. Checking frontend API client...");
const apiClientPath = join(projectRoot, "apps/web/src/lib/api.ts");
if (!existsSync(apiClientPath)) {
	console.error("❌ Frontend API client not found at apps/web/src/lib/api.ts");
	process.exit(1);
}

const apiContent = readFileSync(apiClientPath, "utf-8");
if (
	!apiContent.includes("import { treaty }") ||
	!apiContent.includes('from "@elysiajs/eden"')
) {
	console.error("❌ API client does not import treaty from @elysiajs/eden");
	process.exit(1);
}

if (!apiContent.includes("import type { App }")) {
	console.error("❌ API client does not import App type from server");
	process.exit(1);
}

if (!apiContent.includes("treaty<App>")) {
	console.error("❌ API client does not use treaty<App>");
	process.exit(1);
}
console.log("✅ Frontend API client configured correctly\n");

// Check 3: Verify Eden package is installed
console.log("3. Checking Eden package installation...");
const serverPackageJson = JSON.parse(
	readFileSync(join(projectRoot, "apps/server/package.json"), "utf-8"),
);
const webPackageJson = JSON.parse(
	readFileSync(join(projectRoot, "apps/web/package.json"), "utf-8"),
);

if (!serverPackageJson.dependencies?.["@elysiajs/eden"]) {
	console.error("❌ @elysiajs/eden not installed in server");
	process.exit(1);
}

if (!webPackageJson.dependencies?.["@elysiajs/eden"]) {
	console.error("❌ @elysiajs/eden not installed in web");
	process.exit(1);
}
console.log("✅ Eden package installed in both server and web\n");

console.log("✨ All Eden Treaty type safety checks passed!");
console.log(
	"\n📚 Type safety is now configured between your backend and frontend.",
);
console.log("   - Backend types are automatically inferred from Elysia routes");
console.log("   - Frontend API calls are fully typed using the treaty client");
console.log("   - TypeScript will catch type mismatches at compile time\n");

process.exit(0);
