import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { done, failed, type Answer } from "../answer/index";
import {
  isBlocking,
  isLimited,
  type EntryReport,
  type InstalledPackage,
  type ProbeReport,
  type ProbeRequest,
  type ProbeStep,
} from "./contract";
import { peerSpecs, readInstalled } from "./installed";
import { parseRecords, runnerScript } from "./runner";
import { reportFor } from "./verdict";

const run = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

const TSCONFIG = `${JSON.stringify(
  {
    compilerOptions: {
      module: "nodenext",
      moduleResolution: "nodenext",
      target: "es2023",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["probe.ts"],
  },
  null,
  2,
)}\n`;

export async function probeDelivery(request: ProbeRequest): Promise<Answer<ProbeReport>> {
  const spec = request.version ? `${request.name}@${request.version}` : request.name;
  const installer = request.installer ?? "npm";
  const timeout = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const withTypes = request.types !== false;
  const withPeers = request.peers !== false;
  const projectDir = request.projectDir ?? (await mkdtemp(join(tmpdir(), "delivery-probe-")));
  const steps: ProbeStep[] = [];
  const answer = (summary: string, entries: readonly EntryReport[], installed?: InstalledPackage) =>
    report(steps, summary, spec, request, projectDir, entries, installed);

  await mkdir(projectDir, { recursive: true });
  await writeFile(
    join(projectDir, "package.json"),
    `${JSON.stringify({ name: "delivery-probe", private: true, type: "module", version: "0.0.0" }, null, 2)}\n`,
    "utf8",
  );

  const install = (names: readonly string[]) => [
    "install",
    ...names,
    ...(request.registry ? ["--registry", request.registry] : []),
    ...(installer === "npm" ? ["--no-audit", "--no-fund"] : []),
  ];

  const installed = await step(
    steps,
    "install",
    installer,
    install([spec, ...(withTypes ? [`typescript@${request.typescript ?? "latest"}`] : [])]),
    projectDir,
    timeout,
  );
  if (!installed.ok) return answer("пакет не встал в чистый проект", []);

  const delivery = await readInstalled(projectDir);
  const entries = request.entries ?? delivery?.entries ?? [];
  if (entries.length === 0) {
    return answer("проверять нечего: у поставки не нашлось ни одного подпути", [], delivery);
  }

  if (withPeers && delivery) {
    const peers = peerSpecs(delivery);
    if (peers.length > 0) await step(steps, "install-peers", installer, install(peers), projectDir, timeout);
  }

  await writeFile(join(projectDir, "probe.mjs"), runnerScript(entries), "utf8");
  const imported = await step(steps, "import", process.execPath, ["probe.mjs"], projectDir, timeout);
  const reports = entryReports(entries, imported, delivery);
  steps[steps.length - 1] = { ...imported, output: withoutRecords(imported.output ?? "") };

  const typed = reports.filter((entry) => entry.checkedBy === "import").map((entry) => entry.entry);
  if (withTypes && typed.length > 0) {
    await writeFile(join(projectDir, "probe.ts"), typeScript(typed), "utf8");
    await writeFile(join(projectDir, "tsconfig.json"), TSCONFIG, "utf8");
    await step(
      steps,
      "typecheck",
      join(projectDir, "node_modules", ".bin", "tsc"),
      ["-p", "tsconfig.json"],
      projectDir,
      timeout,
    );
  }

  return answer(summaryOf(reports, steps), reports, delivery);
}

function entryReports(
  entries: readonly string[],
  imported: ProbeStep,
  delivery?: InstalledPackage,
): readonly EntryReport[] {
  const records = parseRecords(imported.output ?? "");

  return entries.map((entry) => {
    const record = records.find((current) => current.entry === entry);
    if (record) return reportFor(record, delivery);

    return {
      entry,
      verdict: "delivery-broken",
      checkedBy: "import",
      durationMs: 0,
      blocker: { message: "проверка оборвалась раньше этого подпути — смотрите вывод шага «import»" },
    };
  });
}

/** Разобранные записи уже лежат в `entries` отчёта — в выводе шага они были бы второй копией. */
function withoutRecords(output: string): string {
  return output
    .split("\n")
    .filter((line) => !line.trim().startsWith("{"))
    .join("\n")
    .trim();
}

function typeScript(entries: readonly string[]): string {
  const lines = entries.map((entry, index) => `import * as entry${index} from ${JSON.stringify(entry)};`);
  const names = entries.map((_, index) => `entry${index}`).join(", ");

  return `${lines.join("\n")}\nconsole.log("подпутей:", [${names}].length);\n`;
}

function summaryOf(entries: readonly EntryReport[], steps: readonly ProbeStep[]): string {
  const broken = entries.filter(isBlocking).length;
  const limited = entries.filter(isLimited).length;
  const brokenStep = steps.find((step) => !step.ok && step.name !== "install-peers");
  const tail = limited > 0 ? `, проверено не до конца: ${limited}` : "";

  if (broken > 0) return `поставка не прошла приёмку: подпутей с дефектом ${broken} из ${entries.length}${tail}`;
  if (brokenStep) return `поставка не прошла приёмку: шаг «${brokenStep.name}»${tail}`;

  return `поставка встала и собралась в чистом проекте: подпутей ${entries.length}${tail}`;
}

async function step(
  steps: ProbeStep[],
  stepName: string,
  file: string,
  args: readonly string[],
  cwd: string,
  timeout: number,
): Promise<ProbeStep> {
  const command = `${file} ${args.join(" ")}`;
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  const record = (ok: boolean, output: string): ProbeStep => {
    const current = { name: stepName, ok, command, durationMs: elapsed(), output: tail(output) };
    steps.push(current);
    return current;
  };

  try {
    const { stdout, stderr } = await run(file, [...args], { cwd, timeout, maxBuffer: 32 * 1024 * 1024 });
    return record(true, `${stdout}${stderr}`);
  } catch (error) {
    return record(false, outputOf(error));
  }
}

function report(
  steps: readonly ProbeStep[],
  summary: string,
  spec: string,
  request: ProbeRequest,
  projectDir: string,
  entries: readonly EntryReport[],
  installed?: InstalledPackage,
): Answer<ProbeReport> {
  const broken = entries.filter(isBlocking);
  const brokenStep = steps.find((step) => !step.ok && step.name !== "install-peers");
  const data: ProbeReport = {
    spec,
    ...(installed ? { installed: { name: installed.name, version: installed.version } } : {}),
    ...(request.registry ? { registry: request.registry } : {}),
    projectDir,
    entries,
    broken: broken.map((entry) => entry.entry),
    limited: entries.filter(isLimited).map((entry) => entry.entry),
    steps,
  };

  if (broken.length === 0 && !brokenStep) return done(summary, data);

  const remedy = broken[0]
    ? `повторите руками в ${projectDir}: ${process.execPath} probe.mjs`
    : `повторите руками в ${projectDir}: ${brokenStep?.command ?? ""}`;

  return failed(summary, { remedy, details: data });
}

function outputOf(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error);
  const shaped = error as { stdout?: string; stderr?: string; message?: string };

  return `${shaped.stdout ?? ""}${shaped.stderr ?? ""}` || (shaped.message ?? String(error));
}

function tail(output: string, limit = 16_000): string {
  const text = output.trim();

  return text.length > limit ? `…${text.slice(-limit)}` : text;
}
