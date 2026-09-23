import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const run = promisify(execFile);

const RUNNER = join(process.cwd(), "node_modules", ".bin", "web-core-node");
const TOOL = join(process.cwd(), "test", "fixtures", "tool.ts");

interface Finished {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function tool(...args: string[]): Promise<Finished> {
  try {
    const { stdout, stderr } = await run(RUNNER, [TOOL, ...args]);
    return { code: 0, stdout, stderr };
  } catch (error) {
    const shaped = error as { code?: number; stdout?: string; stderr?: string };
    return { code: shaped.code ?? -1, stdout: shaped.stdout ?? "", stderr: shaped.stderr ?? "" };
  }
}

describe("тулза на движке — настоящим процессом", () => {
  it("успех: конверт в stdout, нулевой код", { timeout: 60_000 }, async () => {
    const finished = await tool("greet", "мир", "--json");

    expect(finished.code).toBe(0);
    expect(JSON.parse(finished.stdout.trim())).toEqual({
      outcome: "done",
      summary: "привет, мир",
      data: { who: "мир" },
    });
  });

  it("«делать нечего» не валит пайплайн", { timeout: 60_000 }, async () => {
    const finished = await tool("greet", "мир", "--idle");

    expect(finished.code).toBe(0);
    expect(finished.stdout.trim()).toBe("• работы не нашлось");
  });

  it("отказ — код 1 и текст в stderr", { timeout: 60_000 }, async () => {
    const finished = await tool("greet", "мир", "--broken");

    expect(finished.code).toBe(1);
    expect(finished.stdout).toBe("");
    expect(finished.stderr).toContain("✖ не вышло");
  });

  it("неверное употребление — код 2", { timeout: 60_000 }, async () => {
    const finished = await tool("greet");

    expect(finished.code).toBe(2);
    expect(finished.stderr).toContain("✖");
  });

  it("справка печатается и завершается нулём", { timeout: 60_000 }, async () => {
    const finished = await tool("--help");

    expect(finished.code).toBe(0);
    expect(finished.stdout).toContain("greet");
  });
});
