import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Условия `development`/`browser` обязательны — без них `solid-js/web` отдаёт серверную
// сборку и рендер молча перестаёт быть реактивным (тот же довод, что у `router`/`ui`).
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          environment: "jsdom",
          include: ["test/*.test.tsx"],
        },
      },
    ],
  },
});
