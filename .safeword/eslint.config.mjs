// Safeword ESLint config - standalone (no project config to extend)
// Used by hooks for LLM enforcement.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import safeword from "safeword/eslint";


const { detect, configs } = safeword;
const __dirname = dirname(fileURLToPath(import.meta.url));
// Look in parent directory for deps (this file is in .safeword/)
const projectDir = dirname(__dirname);
const deps = detect.collectAllDeps(projectDir);
const framework = detect.detectFramework(deps);

// Monorepo support: detect Next.js apps to scope Next.js-only rules
// - Returns undefined for single-app Next.js projects (use full Next config)
// - Returns string[] of glob patterns for monorepos (scope Next.js rules)
const nextPaths = detect.findNextConfigPaths(projectDir);

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

// Safeword strict rules - applied after project rules (win on conflict)
const safewordStrictRules = {
  rules: {
    // Prevent common LLM mistakes
    "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-undef": "error",
    "no-unreachable": "error",
    "no-constant-condition": "error",
    "no-empty": "error",
    "no-extra-semi": "error",
    "no-func-assign": "error",
    "no-import-assign": "error",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "error",
    "no-loss-of-precision": "error",
    "no-misleading-character-class": "error",
    "no-prototype-builtins": "error",
    "no-unexpected-multiline": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "use-isnan": "error",
    "valid-typeof": "error",
    // Strict code quality
    "eqeqeq": ["error", "always", { null: "ignore" }],
    "no-var": "error",
    "prefer-const": "error",
  },
};

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
  safewordStrictRules,

];
