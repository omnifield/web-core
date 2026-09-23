import { defineConfig } from "vitest/config";

// Чистый Node: MCP-сервер, никакого документа/DOM — браузерных условий разрешения не нужно (тот
// же довод, что у web-core/io).
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/*.test.ts"],
  },
});
