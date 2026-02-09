import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import safeword from "safeword/eslint";

const { detect, configs } = safeword;
const __dirname = dirname(fileURLToPath(import.meta.url));
const deps = detect.collectAllDeps(__dirname);
const framework = detect.detectFramework(deps);

// Monorepo support: detect Next.js apps to scope Next.js-only rules
// - Returns undefined for single-app Next.js projects (use full Next config)
// - Returns string[] of glob patterns for monorepos (scope Next.js rules)
const nextPaths = detect.findNextConfigPaths(__dirname);

// Map framework to base config
// Note: Astro config only lints .astro files, so we combine it with TypeScript config
// to also lint .ts files in Astro projects
// Note: In monorepos, Next.js uses React config + scoped Next.js rules
const baseConfigs = {
  next: nextPaths ? configs.recommendedTypeScriptReact : configs.recommendedTypeScriptNext,
  react: configs.recommendedTypeScriptReact,
  astro: [...configs.recommendedTypeScript, ...configs.astro],
  typescript: configs.recommendedTypeScript,
  javascript: configs.recommended,
};

// Build scoped Next.js rules for monorepos
// Each Next.js app gets its own scoped config with files: pattern
const scopedNextConfigs = nextPaths?.flatMap((filePath) =>
  configs.nextOnlyRules.map((config) => ({ ...config, files: [filePath] }))
) ?? [];

export default [
  { ignores: detect.getIgnores(deps) },
  ...baseConfigs[framework],
  ...scopedNextConfigs,
  // Testing configs - always included (file-scoped to *.test.* and *.e2e.*)
  ...configs.vitest,
  ...configs.playwright,
  // Storybook - always included (file-scoped to *.stories.*)
  ...configs.storybook,
  // TanStack Query - always included (rules only match useQuery/useMutation patterns)
  ...configs.tanstackQuery,
  // Tailwind - only if detected (plugin needs tailwind config to validate classes)
  ...(detect.hasTailwind(deps) ? configs.tailwind : []),
  // Turborepo - only if detected (validates env vars are declared in turbo.json)
  ...(detect.hasTurbo(deps) ? configs.turbo : []),
];
