import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { done, failed, nothing } from "../src/answer/index";
import { defineCommand } from "../src/command/index";
import { runProgram, type ProgramDeclaration } from "../src/program/index";
import { recorder } from "./recorder";

const echo = defineCommand({
  name: "echo",
  summary: "отдаёт разрешённые настройки как есть",
  args: [{ name: "target", summary: "над чем работаем", required: true }],
  options: {
    registry: {
      flags: "--registry <url>",
      summary: "адрес реестра",
      env: "PROBE_REGISTRY",
      config: "publish.registry",
      default: "https://registry.npmjs.org/",
    },
    dryRun: { flags: "--dry-run", summary: "ничего не менять" },
  },
  run({ options, args }) {
    return done(`цель ${args[0]}`, { registry: options.registry, dryRun: options.dryRun });
  },
});

function program(...commands: ProgramDeclaration["commands"]): ProgramDeclaration {
  return { name: "probe-tool", summary: "тестовая тулза", commands };
}

async function run(declaration: ProgramDeclaration, argv: string[], env: Record<string, string> = {}) {
  const recorded = recorder();
  const code = await runProgram(declaration, { argv, channel: recorded.channel, env });
  return { code, ...recorded };
}

describe("разрешение настройки по слоям", () => {
  it("дефолт работает, когда не сказали ничего", async () => {
    const { code, out } = await run(program(echo), ["echo", "пакет", "--json"]);

    expect(code).toBe(0);
    expect(JSON.parse(out[0] ?? "").data).toEqual({
      registry: "https://registry.npmjs.org/",
      dryRun: undefined,
    });
  });

  it("аргумент сильнее окружения, окружение сильнее дефолта", async () => {
    process.env["PROBE_REGISTRY"] = "https://from-env/";

    try {
      const fromEnv = await run(program(echo), ["echo", "пакет", "--json"]);
      const fromFlag = await run(program(echo), ["echo", "пакет", "--json", "--registry", "https://from-flag/"]);

      expect(JSON.parse(fromEnv.out[0] ?? "").data.registry).toBe("https://from-env/");
      expect(JSON.parse(fromFlag.out[0] ?? "").data.registry).toBe("https://from-flag/");
    } finally {
      delete process.env["PROBE_REGISTRY"];
    }
  });

  it("файл конфига сильнее дефолта и слабее флага", async () => {
    const dir = await mkdtemp(join(tmpdir(), "web-core-cli-"));
    const path = join(dir, "probe.json");
    await writeFile(path, JSON.stringify({ publish: { registry: "https://from-file/" } }), "utf8");

    const fromFile = await run(program(echo), ["echo", "пакет", "--json", "--config", path]);
    const fromFlag = await run(program(echo), [
      "echo",
      "пакет",
      "--json",
      "--config",
      path,
      "--registry",
      "https://from-flag/",
    ]);

    expect(JSON.parse(fromFile.out[0] ?? "").data.registry).toBe("https://from-file/");
    expect(JSON.parse(fromFlag.out[0] ?? "").data.registry).toBe("https://from-flag/");
  });

  it("требуемая настройка без единого слоя — это неверное употребление, а не отказ", async () => {
    const strict = defineCommand({
      name: "strict",
      summary: "требует адрес",
      options: { registry: { flags: "--registry <url>", summary: "адрес реестра", required: true } },
      run: () => done("не должно вызваться"),
    });

    const { code, err } = await run(program(strict), ["strict"]);

    expect(code).toBe(2);
    expect(err[0]).toContain("нечем взять настройку");
  });
});

describe("исход и код возврата", () => {
  it("«делать нечего» не валит пайплайн", async () => {
    const idle = defineCommand({
      name: "idle",
      summary: "работы не нашлось",
      run: () => nothing("накопленных изменений нет"),
    });

    const { code, out } = await run(program(idle), ["idle"]);

    expect(code).toBe(0);
    expect(out).toEqual(["• накопленных изменений нет"]);
  });

  it("отказ печатается одинаково и даёт единицу", async () => {
    const broken = defineCommand({
      name: "broken",
      summary: "всегда отказ",
      run: () => failed("реестр не ответил", { remedy: "проверьте --registry" }),
    });

    const { code, err } = await run(program(broken), ["broken"]);

    expect(code).toBe(1);
    expect(err).toEqual(["✖ реестр не ответил", "  → проверьте --registry"]);
  });

  it("исключение внутри команды становится тем же конвертом отказа", async () => {
    const throwing = defineCommand({
      name: "throwing",
      summary: "падает",
      run: () => {
        throw new Error("сеть отвалилась");
      },
    });

    const { code, out } = await run(program(throwing), ["throwing", "--json"]);
    const answer = JSON.parse(out[0] ?? "");

    expect(code).toBe(1);
    expect(answer.outcome).toBe("failed");
    expect(answer.summary).toBe("сеть отвалилась");
  });

  it("неизвестный флаг — код неверного употребления, а не падение", async () => {
    const { code, err } = await run(program(echo), ["echo", "пакет", "--nope"]);

    expect(code).toBe(2);
    expect(err[0]).toContain("✖");
  });

  it("свои числа кодов применяются целиком", async () => {
    const idle = defineCommand({
      name: "idle",
      summary: "работы не нашлось",
      run: () => nothing("нечего делать"),
    });

    const { code } = await run(
      { name: "probe-tool", summary: "тестовая тулза", commands: [idle], exitCodes: { nothing: 3 } },
      ["idle"],
    );

    expect(code).toBe(3);
  });
});

describe("форма тулзы", () => {
  it("одна команда с именем программы зовётся без подкоманды", async () => {
    const solo = defineCommand({
      name: "probe-tool",
      summary: "единственная работа",
      run: () => done("сделано"),
    });

    const { code, out } = await run(program(solo), []);

    expect(code).toBe(0);
    expect(out).toEqual(["✔ сделано"]);
  });

  it("контекст несёт признак машинного вывода и путь конфига", async () => {
    const dir = await mkdtemp(join(tmpdir(), "web-core-cli-"));
    const path = join(dir, "probe.json");
    await writeFile(path, JSON.stringify({ any: true }), "utf8");

    const spy = defineCommand({
      name: "spy",
      summary: "отдаёт контекст",
      run: (_input, context) => done("контекст", { json: context.json, configPath: context.configPath }),
    });

    const { out } = await run(program(spy), ["spy", "--json", "--config", path]);

    expect(JSON.parse(out[0] ?? "").data).toEqual({ json: true, configPath: path });
  });
});
