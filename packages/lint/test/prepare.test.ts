// `prepare` объявлен и действительно строит пакет с нуля. Что проба утверждает, а что нет, и
// почему копия собирается именно так — FAQ.md.

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");

const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  exports: Record<string, string | Record<string, string>>;
  scripts?: Record<string, string>;
};

/** Всё, из чего собирается пакет, и ни файла сборки; без `scripts` падает второй шаг `build`. */
const SOURCES = ["package.json", "tsconfig.json", "tsconfig.build.json", "src", "scripts"];

/** Служебное в `node_modules`, что копии не нужно: своё дерево пакетов и отчёты менеджера. */
const MANAGER_INTERNALS = new Set([".pnpm", ".modules.yaml", ".package-map.json", ".vite"]);

let workDir = "";
/** Копия пакета БЕЗ `dist` — состояние свежего клона, где сборку ещё не запускали. */
let copy = "";

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "web-core-lint-prepare-"));
  copy = join(workDir, "package");

  for (const entry of SOURCES) {
    cpSync(join(pkgRoot, entry), join(copy, entry), { recursive: true });
  }

  // РЕАЛЬНАЯ папка со ссылками на отдельные пакеты, а не одна ссылка на папку пакета: одной
  // ссылкой pnpm переписывает `node_modules` самого пакета. Замер — FAQ.md.
  mkdirSync(join(copy, "node_modules"), { recursive: true });
  for (const entry of readdirSync(join(pkgRoot, "node_modules"))) {
    if (MANAGER_INTERNALS.has(entry) || entry.startsWith(".vite")) continue;
    symlinkSync(join(pkgRoot, "node_modules", entry), join(copy, "node_modules", entry), "dir");
  }
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("оснастка собирается на установке", () => {
  it("манифест объявляет `prepare`, и он ведёт в сборку пакета", () => {
    expect(manifest.scripts?.prepare).toBe("pnpm run build");
  });

  it("в чистой копии сборки нет — иначе проба зеленела бы от чужого следа", () => {
    expect(existsSync(join(copy, "dist"))).toBe(false);
  });

  it("`prepare` строит пакет с нуля: каждая цель `exports` появляется на диске", () => {
    // Флаг — про раскладку пробы, а не про предмет: в копии нет lockfile'а. См. FAQ.md.
    try {
      execFileSync("pnpm", ["--config.verify-deps-before-run=false", "run", "prepare"], {
        cwd: copy,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      // Без этого отказ читается как «Command failed» и причину приходится искать вслепую, а
      // причина у сборки всегда в её собственном выводе.
      const failure = error as { stdout?: string; stderr?: string };
      throw new Error(`\`prepare\` не собрал пакет:\n${failure.stdout}\n${failure.stderr}`);
    }

    // Целей у пресета несколько, и каждую порождает сборка — отбирать их по префиксу
    // здесь нечего: любая цель `exports`, которой после `prepare` нет на диске, это отказ.
    const missing = Object.values(manifest.exports)
      .flatMap((entry) => (typeof entry === "string" ? [entry] : Object.values(entry)))
      .map((target) => target.replace(/^\.\//, ""))
      .filter((target) => !existsSync(join(copy, target)));

    expect(missing).toEqual([]);
  });
});
