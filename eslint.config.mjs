import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  // Don't lint build output / deps
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "out/**"],
  },

  // TypeScript + JSX parsing for your app
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...(nextPlugin.configs.recommended?.rules ?? {}),
      ...(nextPlugin.configs["core-web-vitals"]?.rules ?? {}),
    },
  },

  // Base TS rules (non-type-aware; fast and good enough)
  ...tseslint.configs.recommended,
];