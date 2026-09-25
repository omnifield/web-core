// Предварительная оптимизация зависимостей у потребителя. Разбор — FAQ.md пакета.
import { resolve } from "node:path";

import type { Plugin } from "vite";

import { findNestedCjsIncludes } from "./nested-cjs.js";

/** Спецификаторы вендора, которых у потребителя в зависимостях нет и быть не должно. */
const VENDOR = /^solid-js(\/.*)?$/;

/** Входы вендора поимённо — исключение из пребандла шаблонов не понимает. */
const VENDOR_ENTRIES = [
  "solid-js",
  "solid-js/web",
  "solid-js/store",
  "solid-js/html",
  "solid-js/h",
  "solid-js/jsx-runtime",
  "solid-js/jsx-dev-runtime",
];

/** Плагин, правящий список и разбор предварительной оптимизации после чужих плагинов. */
export function optimizeDepsPlugin(): Plugin {
  return {
    name: "web-core-build:optimize-deps",

    // `post` — обе правки перебивают то, что выставили плагины до нас.
    config: {
      order: "post",
      handler(config, env) {
        const optimizeDeps = (config.optimizeDeps ??= {});

        // Мутация, а не возврат: возвращённый массив Vite СКЛЕИТ с прежним, и снятое вернётся.
        if (optimizeDeps.include) {
          optimizeDeps.include = optimizeDeps.include.filter((id) => !VENDOR.test(id));
        }

        // CommonJS под пакетом с сырой разметкой: сканер туда не заходит, см. FAQ.md.
        if (env.command === "serve") {
          const nested = findNestedCjsIncludes(resolve(config.root ?? process.cwd()));
          const include = new Set([...(optimizeDeps.include ?? []), ...nested]);
          optimizeDeps.include = [...include];
        }

        // Вендор мимо пребандла: копия в чанке — отдельный экземпляр рантайма, см. FAQ.md.
        const exclude = new Set(optimizeDeps.exclude ?? []);
        for (const entry of VENDOR_ENTRIES) exclude.add(entry);
        optimizeDeps.exclude = [...exclude];

        const rolldown = (optimizeDeps.rolldownOptions ??= {});
        const transform = (rolldown.transform ??= {});
        transform.jsx = { runtime: "classic" };
      },
    },
  };
}
