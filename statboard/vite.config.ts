// Сборка — фабрика оснастки, своей конфигурации репозиторий не заводит.
// Порт задаётся флагом в скриптах манифеста: это запуск, а не конфиг.
// Плагин маршрутов стоит ПЕРЕД плагинами фабрики — порядок обязателен, разбор в FAQ.md.
import { defineConfig } from "@web-core/build/vite";
import { tanstackRouterVitePlugin } from "@web-core/router/vite";

const config = defineConfig();

export default {
  ...config,
  plugins: [
    tanstackRouterVitePlugin({
      autoCodeSplitting: false,
      virtualRouteConfig: "./src/shared/configs/routes.config.ts",
    }),
    ...(config.plugins ?? []),
  ],
};
