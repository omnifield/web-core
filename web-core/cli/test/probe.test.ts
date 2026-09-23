import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { probeDelivery, type EntryReport } from "../src/probe/index";

const run = promisify(execFile);

interface Fixture {
  readonly exports: Record<string, string>;
  readonly files: readonly string[];
  /** Путь внутри пакета → содержимое; по умолчанию один `index.js`. */
  readonly sources?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly peerDependenciesMeta?: Record<string, { readonly optional: boolean }>;
}

/** Собирает настоящий тарбол мини-пакета — проба должна видеть поставку, а не файлы на диске. */
async function packFixture(name: string, fixture: Fixture): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "probe-fixture-"));
  const sources = fixture.sources ?? { "index.js": "export const ok = true;\n" };

  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({
      name,
      version: "1.0.0",
      type: "module",
      exports: fixture.exports,
      files: fixture.files,
      ...(fixture.peerDependencies ? { peerDependencies: fixture.peerDependencies } : {}),
      ...(fixture.peerDependenciesMeta ? { peerDependenciesMeta: fixture.peerDependenciesMeta } : {}),
    }),
    "utf8",
  );

  for (const [path, content] of Object.entries(sources)) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), content, "utf8");
  }

  await run("npm", ["pack", "--loglevel=error"], { cwd: dir });
  const packed = (await readdir(dir)).find((entry) => entry.endsWith(".tgz"));

  return join(dir, packed ?? "");
}

function entryOf(entries: readonly EntryReport[], suffix: string): EntryReport | undefined {
  return entries.find((entry) => entry.entry.endsWith(suffix));
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
      expect(answer.data.entries.map((entry) => entry.verdict)).toEqual(["ok"]);
      expect(answer.data.entries[0]?.checkedBy).toBe("import");
      expect(answer.data.broken).toEqual([]);
    },
    120_000,
  );

  it(
    "условие exports, ведущее в отсутствующий в тарболе файл, называется дефектом поставки",
    async () => {
      const tarball = await packFixture("probe-fixture-broken", {
        exports: { ".": "./src/index.js" },
        files: ["index.js"],
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("failed");
      if (answer.outcome !== "failed") return;
      const report = answer.details as { entries: readonly EntryReport[]; broken: readonly string[] };
      expect(report.entries[0]?.verdict).toBe("delivery-broken");
      expect(report.broken).toEqual(["probe-fixture-broken"]);
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
      expect(answer.data.entries.map((entry) => entry.entry)).toEqual([
        "probe-fixture-subpaths",
        "probe-fixture-subpaths/extra",
      ]);
    },
    120_000,
  );

  it(
    "подпуть, который модулем не является, проверяется файлом — но его отсутствие не пропускается",
    async () => {
      const tarball = await packFixture("probe-fixture-assets", {
        exports: { ".": "./index.js", "./base.css": "./base.css", "./conf": "./data.json", "./gone.css": "./gone.css" },
        files: ["index.js", "base.css", "data.json"],
        sources: {
          "index.js": "export const ok = true;\n",
          "base.css": "body { color: red; }\n",
          "data.json": '{ "ok": true }\n',
        },
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("failed");
      if (answer.outcome !== "failed") return;
      const report = answer.details as { entries: readonly EntryReport[]; broken: readonly string[] };

      expect(entryOf(report.entries, "/base.css")).toMatchObject({ verdict: "ok", checkedBy: "file" });
      expect(entryOf(report.entries, "/conf")).toMatchObject({ verdict: "ok", checkedBy: "json-import" });
      expect(report.broken).toEqual(["probe-fixture-assets/gone.css"]);
    },
    120_000,
  );

  it(
    "необязательный peer, которого нет, — не отказ поставки, а названное ограничение",
    async () => {
      const peer = await packFixture("probe-fixture-peer", {
        exports: { ".": "./index.js" },
        files: ["index.js"],
      });
      const tarball = await packFixture("probe-fixture-needs-peer", {
        exports: { ".": "./index.js" },
        files: ["index.js"],
        sources: { "index.js": "export * from 'probe-fixture-peer';\n" },
        peerDependencies: { "probe-fixture-peer": `file:${peer}` },
        peerDependenciesMeta: { "probe-fixture-peer": { optional: true } },
      });

      const answer = await probeDelivery({ name: tarball, types: false, peers: false });

      expect(answer.outcome).toBe("done");
      if (answer.outcome !== "done") return;
      expect(answer.data.entries[0]).toMatchObject({
        verdict: "peer-missing",
        blocker: { missing: "probe-fixture-peer", optional: true },
      });
      expect(answer.data.limited).toEqual(["probe-fixture-needs-peer"]);
    },
    120_000,
  );

  it(
    "peer ставится перед импортом, а поломка в его файлах не приписывается проверяемой поставке",
    async () => {
      const peer = await packFixture("probe-fixture-peer-dir", {
        exports: { ".": "./index.js", "./sub": "./sub" },
        files: ["index.js", "sub"],
        sources: { "index.js": "export const ok = true;\n", "sub/index.js": "export const deep = true;\n" },
      });
      const tarball = await packFixture("probe-fixture-uses-peer", {
        exports: { ".": "./index.js" },
        files: ["index.js"],
        sources: { "index.js": "export * from 'probe-fixture-peer-dir/sub';\n" },
        peerDependencies: { "probe-fixture-peer-dir": `file:${peer}` },
        peerDependenciesMeta: { "probe-fixture-peer-dir": { optional: true } },
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("failed");
      if (answer.outcome !== "failed") return;
      const report = answer.details as { entries: readonly EntryReport[]; steps: readonly { name: string }[] };

      expect(report.steps.map((step) => step.name)).toContain("install-peers");
      expect(report.entries[0]).toMatchObject({
        verdict: "foreign-broken",
        blocker: { culprit: "probe-fixture-peer-dir", importedBy: "probe-fixture-uses-peer" },
      });
    },
    120_000,
  );

  it(
    "необъявленная зависимость — дефект поставки, а не нехватка peer'а",
    async () => {
      const tarball = await packFixture("probe-fixture-undeclared", {
        exports: { ".": "./index.js" },
        files: ["index.js"],
        sources: { "index.js": "export * from 'probe-fixture-nowhere';\n" },
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("failed");
      if (answer.outcome !== "failed") return;
      const report = answer.details as { entries: readonly EntryReport[] };
      expect(report.entries[0]).toMatchObject({
        verdict: "dependency-undeclared",
        blocker: { missing: "probe-fixture-nowhere" },
      });
    },
    120_000,
  );

  it(
    "код, отказавшийся исполняться в node, — предел проверки, а не приговор поставке",
    async () => {
      const tarball = await packFixture("probe-fixture-client-only", {
        exports: { ".": "./index.js" },
        files: ["index.js"],
        sources: { "index.js": 'throw new Error("Client-only API called on the server side");\n' },
      });

      const answer = await probeDelivery({ name: tarball, types: false });

      expect(answer.outcome).toBe("done");
      if (answer.outcome !== "done") return;
      expect(answer.data.entries[0]?.verdict).toBe("node-refused");
      expect(answer.data.limited).toEqual(["probe-fixture-client-only"]);
      expect(answer.data.broken).toEqual([]);
    },
    120_000,
  );
});
