import { defineConfig } from "@web-core/lint/eslint";

export default [
  {
    ignores: ["node_modules/**"],
  },
  ...defineConfig(),
];
