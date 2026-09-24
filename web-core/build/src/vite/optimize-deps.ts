// Предварительная оптимизация зависимостей у потребителя. Разбор — FAQ.md пакета.
import type { Plugin } from "vite";

/** Спецификаторы вендора, которых у потребителя в зависимостях нет и быть не должно. */
const VENDOR = /^solid-js(\/.*)?$/;

/** Плагин, правящий список и разбор предварительной оптимизации после чужих плагинов. */
export function optimizeDepsPlugin(): Plugin {
  return {
    name: "web-core-build:optimize-deps",

    // `post` — обе правки перебивают то, что выставили плагины до нас.
    config: {
      order: "post",
      handler(config) {
        const optimizeDeps = (config.optimizeDeps ??= {});

        // Мутация, а не возврат: возвращённый массив Vite СКЛЕИТ с прежним, и снятое вернётся.
        if (optimizeDeps.include) {
          optimizeDeps.include = optimizeDeps.include.filter((id) => !VENDOR.test(id));
        }

        const rolldown = (optimizeDeps.rolldownOptions ??= {});
        const transform = (rolldown.transform ??= {});
        transform.jsx = { runtime: "classic" };
      },
    },
  };
}
