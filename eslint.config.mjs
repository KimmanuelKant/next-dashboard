import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  // Ignore build output and deps
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "out/**"],
  },

  // Base JS/TS files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      // Equivalent of next/core-web-vitals
      ...(nextPlugin.configs.recommended?.rules ?? {}),
      ...(nextPlugin.configs["core-web-vitals"]?.rules ?? {}),
    },
  },
];