import { execFile } from "node:child_process";
import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { probeDelivery } from "../src/probe/index";

const run = promisify(execFile);

interface Fixture {
  readonly exports: Record<string, string>;
  readonly files: readonly string[];
}

/** Собирает настоящий тарбол мини-пакета — проба должна видеть поставку, а не файлы на диске. */
async function packFixture(name: string, fixture: Fixture): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "probe-fixture-"));

  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({
      name,
      version: "1.0.0",
      type: "module",
      exports: fixture.exports,
      files: fixture.files,
    }),
    "utf8",
  );
  await writeFile(join(dir, "index.js"), "export const ok = true;\n", "utf8");

  await run("npm", ["pack", "--loglevel=error"], { cwd: dir });
  const packed = (await readdir(dir)).find((entry) => entry.endsWith(".tgz"));

  return join(dir, packed ?? "");
}

describe("проба поставки", () => {
  it(
    "здоровый тарбол встаёт в чистый проект и импортируется",
    async () => {
      const tarball = await packFixture("probe-fixture-ok", {
        exports: { ".": "./index.js" },
        files: ["index.js"],
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("done");
      if (answer.outcome !== "done") return;
      expect(answer.data.installed?.name).toBe("probe-fixture-ok");
      expect(answer.data.entries).toEqual(["probe-fixture-ok"]);
      expect(answer.data.steps.map((step) => step.name)).toEqual(["install", "import"]);
    },
    120_000,
  );

  it(
    "условие exports, ведущее в отсутствующий в тарболе файл, ловится на импорте",
    async () => {
      const tarball = await packFixture("probe-fixture-broken", {
        exports: { ".": "./src/index.js" },
        files: ["index.js"],
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("failed");
      if (answer.outcome !== "failed") return;
      expect(answer.summary).toContain("шаг «import»");
      expect(answer.remedy).toContain("повторите руками");
    },
    120_000,
  );

  it(
    "подпути берутся из exports установленного пакета, если их не назвали",
    async () => {
      const tarball = await packFixture("probe-fixture-subpaths", {
        exports: { ".": "./index.js", "./extra": "./index.js" },
        files: ["index.js"],
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("done");
      if (answer.outcome !== "done") return;
      expect(answer.data.entries).toEqual(["probe-fixture-subpaths", "probe-fixture-subpaths/extra"]);
    },
    120_000,
  );
});
