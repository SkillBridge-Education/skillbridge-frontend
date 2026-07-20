const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh").default;

module.exports = [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Only the long-standing hooks rules, not react-hooks v7's newer
      // React Compiler-readiness checks (static-components, immutability,
      // refs, etc.) - those need a dedicated cleanup pass on existing code,
      // not a blanket "recommended" turned on retroactively.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // This codebase uses `catch {}` deliberately in several fire-and-forget
      // spots (e.g. parsing optional JSON, best-effort UI calls).
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
