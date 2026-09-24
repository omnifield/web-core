// Резолв вендора от оснастки, а не от папки потребителя. Разбор — FAQ.md пакета.
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite";

/** Спецификаторы, которые чужой код (обвязка горячей замены) вписывает в файлы потребителя. */
const VENDOR = /^solid-js(\/.*)?$/;

const SELF = fileURLToPath(import.meta.url);

/** Плагин, уводящий поиск вендора в зависимости этой зоны. */
export function vendorResolvePlugin(): Plugin {
  return {
    name: "web-core-build:vendor-resolve",
    enforce: "pre",
    async resolveId(source, _importer, options) {
      if (!VENDOR.test(source)) return null;

      // Через `this.resolve` от файла оснастки: условия разрешения и `exports` вендора остаются
      // вендорскими, меняется только место поиска.
      return await this.resolve(source, SELF, { ...options, skipSelf: true });
    },
  };
}
