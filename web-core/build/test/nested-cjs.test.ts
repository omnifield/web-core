// Класс, который ловит эта проба, разобран в FAQ.md пакета.
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findNestedCjsIncludes } from "../src/vite/nested-cjs";

const FIXTURE = fileURLToPath(new URL("./fixture", import.meta.url));
const DEPS = join(FIXTURE, "node_modules", ".vite", "deps");
const PORT = 5187;

function wait(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

async function until(check: () => boolean, limit: number): Promise<boolean> {
  const deadline = Date.now() + limit;

  while (Date.now() < deadline) {
    if (check()) return true;
    await wait(250);
  }
  return check();
}

describe("CommonJS под пакетом с сырой разметкой", () => {
  let server: ChildProcess;

  beforeAll(async () => {
    rmSync(DEPS, { recursive: true, force: true });

    server = spawn(join(FIXTURE, "node_modules", ".bin", "web-core-vite"), ["--port", `${PORT}`], {
      cwd: FIXTURE,
      stdio: "ignore",
    });

    const up = await until(() => existsSync(DEPS), 60_000);
    if (up) await fetch(`http://localhost:${PORT}/src/main.tsx`).catch(() => undefined);
  }, 90_000);

  afterAll(() => {
    server?.kill();
  });

  it("назван цепочкой от прямой зависимости потребителя", () => {
    expect(findNestedCjsIncludes(FIXTURE)).toContain(
      "@web-core/build-fixture-dep > solid-markdown > remark-parse > mdast-util-from-markdown > micromark > debug",
    );
  });

  it("уезжает потребителю разобранным, а не файлом пакета", async () => {
    const bundled = await until(
      () => readdirSync(DEPS).some((file) => file.includes("debug") && file.endsWith(".js")),
      30_000,
    );

    expect(bundled).toBe(true);
  }, 60_000);
});
