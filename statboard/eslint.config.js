import { defineConfig } from "@web-core/lint/eslint";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".nx/**",
      "src/routeTree.gen.ts",
    ],
  },
  ...defineConfig(),
];
