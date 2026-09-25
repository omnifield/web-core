// CommonJS в глубине пакета, который пребандлу не поддаётся. ВНУТРЕННЕЕ — не в exports
// манифеста. Разбор — FAQ.md пакета.

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, extname, join } from "node:path";

import { trace } from "../shared/trace.js";

/** Условие `exports`, которым пакет объявляет неразобранную разметку внутри. */
const RAW_CONDITION = '"solid"';

function readJson(file: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/** Манифест зависимости по правилам менеджера пакетов: вверх по `node_modules` от родителя. */
function findManifest(name: string, from: string): string | undefined {
  let dir = from;

  for (;;) {
    const candidate = join(dir, "node_modules", name, "package.json");
    if (existsSync(candidate)) {
      try {
        return realpathSync(candidate);
      } catch {
        return undefined;
      }
    }

    const up = dirname(dir);
    if (up === dir) return undefined;
    dir = up;
  }
}

function isNeighbour(manifestPath: string): boolean {
  return !manifestPath.split(/[\\/]/).includes("node_modules");
}

function isRaw(manifest: Record<string, unknown>): boolean {
  return JSON.stringify(manifest.exports ?? {}).includes(RAW_CONDITION);
}

/** Признак пакета, которому нужен интероп: эвристика рынка, см. FAQ.md. */
function needsInterop(manifest: Record<string, unknown>, manifestPath: string): boolean {
  if (manifest.module || manifest.exports) return false;

  // Пустая строка — раскладка пакета, где лежат одни типы: входа нет, пребандлить нечего.
  if (typeof manifest.main === "string" && manifest.main !== "") {
    const extension = extname(manifest.main);
    return extension === "" || extension === ".js" || extension === ".cjs";
  }

  return existsSync(join(dirname(manifestPath), "index.js"));
}

function dependencyNames(manifest: Record<string, unknown>): string[] {
  const block = manifest.dependencies;
  return block && typeof block === "object" ? Object.keys(block) : [];
}

/** Записи `optimizeDeps.include` для CommonJS, спрятанного под пакетом с сырой разметкой. */
export function findNestedCjsIncludes(projectRoot: string): string[] {
  const done = trace("findNestedCjsIncludes");

  const includes: string[] = [];
  const walked = new Set<string>();

  function walk(packageDir: string, names: string[], chain: string[], raw: boolean): void {
    for (const name of names) {
      const manifestPath = findManifest(name, packageDir);
      if (!manifestPath) continue;

      const manifest = readJson(manifestPath);
      if (!manifest) continue;

      const nextChain = [...chain, name];

      // Сосед виден исходником — его импорты сборщик находит сам; сырым остаётся только то,
      // что лежит за пакетом с сырой разметкой.
      const neighbour = isNeighbour(manifestPath);
      const nextRaw = !neighbour && (raw || isRaw(manifest));

      if (nextRaw && needsInterop(manifest, manifestPath)) {
        includes.push(nextChain.join(" > "));
        continue;
      }

      if (!neighbour && !nextRaw) continue;
      if (walked.has(manifestPath)) continue;
      walked.add(manifestPath);

      walk(dirname(manifestPath), dependencyNames(manifest), nextChain, nextRaw);
    }
  }

  const root = readJson(join(projectRoot, "package.json"));
  if (root) {
    const direct = new Set<string>();
    for (const field of ["dependencies", "devDependencies"] as const) {
      const block = root[field];
      if (block && typeof block === "object") {
        for (const name of Object.keys(block)) direct.add(name);
      }
    }
    walk(projectRoot, [...direct], [], false);
  }

  done();
  return [...new Set(includes)].sort();
}
