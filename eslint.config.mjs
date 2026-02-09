import globals from "globals";

import safewordConfig from "./.safeword/eslint.config.mjs";

export default [
	...safewordConfig,
	{
		ignores: [
			".safeword/",
			"scripts/",
			"**/prisma/generated/",
			".dependency-cruiser.cjs",
			"eslint.config.mjs",
			"**/*.html",
		],
	},
	// Global overrides (built-in rules only)
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
				React: "readonly",
				Timer: "readonly",
			},
		},
		rules: {
			"no-unused-vars": "off",
			complexity: "warn",
			eqeqeq: "warn",
			"no-useless-assignment": "warn",
			"max-depth": "warn",
		},
	},
	// Plugin rule overrides — scoped to JS/TS files where plugins are registered
	{
		files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
		rules: {
			// Off — not applicable to this codebase
			"unicorn/no-null": "off",
			"import-x/no-unresolved": "off",
			"unicorn/prevent-abbreviations": "off",
			"sonarjs/todo-tag": "off",
			"sonarjs/prefer-read-only-props": "off",
			"security/detect-object-injection": "off",
			"safeword/no-re-export-all": "off",
			"@typescript-eslint/strict-boolean-expressions": "off",
			// Downgrade to warnings — address incrementally
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-unnecessary-condition": "warn",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/require-await": "warn",
			"@typescript-eslint/prefer-nullish-coalescing": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/restrict-template-expressions": "warn",
			"@typescript-eslint/no-confusing-void-expression": "warn",
			"@typescript-eslint/no-misused-promises": "warn",
			"@typescript-eslint/no-base-to-string": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"sonarjs/cognitive-complexity": "warn",
			"sonarjs/no-inconsistent-returns": "warn",
			"sonarjs/no-nested-conditional": "warn",
			"sonarjs/no-identical-functions": "warn",
			"sonarjs/pseudo-random": "warn",
			"sonarjs/function-return-type": "warn",
			"safeword/no-incomplete-error-handling": "warn",
			"react/no-unescaped-entities": "warn",
			"jsx-a11y/no-autofocus": "warn",
			"unicorn/consistent-function-scoping": "warn",
			"unicorn/consistent-destructuring": "warn",
			"unicorn/prefer-add-event-listener": "warn",
			"unicorn/no-abusive-eslint-disable": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/switch-exhaustiveness-check": "warn",
			"@typescript-eslint/no-invalid-void-type": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/no-unsafe-enum-comparison": "warn",
			"@typescript-eslint/no-unnecessary-type-parameters": "warn",
			"@typescript-eslint/no-shadow": "warn",
			"@typescript-eslint/no-misused-spread": "warn",
			"sonarjs/slow-regex": "warn",
			"sonarjs/no-nested-template-literals": "warn",
			"sonarjs/no-invariant-returns": "warn",
			"sonarjs/no-all-duplicated-branches": "warn",
			"regexp/strict": "warn",
			"regexp/no-super-linear-backtracking": "warn",
			"jsx-a11y/label-has-associated-control": "warn",
			"unicorn/no-array-reverse": "warn",
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/no-deriving-state-in-effects": "warn",
		},
	},
];
