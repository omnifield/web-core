// Запуск бинарника вендора, который пакет держит своей зависимостью. Разбор — FAQ.md пакета.
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

/**
 * Исполняет CLI вендорского пакета в текущем процессе — аргументы командной строки достаются
 * ему как есть.
 *
 * @param {string} name имя пакета; его же ключ берётся из `bin` манифеста
 */
export async function runVendorBin(name) {
  const manifestPath = require.resolve(`${name}/package.json`);
  const { bin } = require(manifestPath);
  const entry = typeof bin === "string" ? bin : bin?.[name];

  if (!entry) throw new Error(`У пакета ${name} нет бинарника ${name} в манифесте`);

  await import(pathToFileURL(resolve(dirname(manifestPath), entry)).href);
}
