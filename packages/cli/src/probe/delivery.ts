import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { done, failed, type Answer } from "../answer/index";

const run = promisify(execFile);

export type Installer = "npm" | "pnpm" | "yarn";

export interface ProbeRequest {
  /** Что ставим: имя пакета, путь к тарболу — всё, что понимает установщик. Наш список пакетов тулзе неизвестен. */
  readonly name: string;
  readonly version?: string;
  readonly registry?: string;
  readonly installer?: Installer;
  /** Подпути для проверки; по умолчанию — всё, что установленный пакет объявил в `exports`. */
  readonly entries?: readonly string[];
  /** Куда развернуть чистый проект; по умолчанию — свежая временная папка. */
  readonly projectDir?: string;
  /** Проверять ли типы (`tsc --noEmit` в чистом проекте). */
  readonly types?: boolean;
  readonly typescript?: string;
  readonly timeoutMs?: number;
}

export interface ProbeStep {
  readonly name: string;
  readonly ok: boolean;
  readonly command: string;
  readonly durationMs: number;
  readonly output?: string;
}

export interface ProbeReport {
  /** Спецификатор, который реально ушёл установщику. */
  readonly spec: string;
  readonly installed?: { readonly name: string; readonly version: string };
  readonly registry?: string;
  readonly projectDir: string;
  readonly entries: readonly string[];
  readonly steps: readonly ProbeStep[];
}

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
  const projectDir = request.projectDir ?? (await mkdtemp(join(tmpdir(), "delivery-probe-")));
  const steps: ProbeStep[] = [];

  await mkdir(projectDir, { recursive: true });
  await writeFile(
    join(projectDir, "package.json"),
    `${JSON.stringify({ name: "delivery-probe", private: true, type: "module", version: "0.0.0" }, null, 2)}\n`,
    "utf8",
  );

  const installArgs = [
    "install",
    spec,
    ...(withTypes ? [`typescript@${request.typescript ?? "latest"}`] : []),
    ...(request.registry ? ["--registry", request.registry] : []),
    ...(installer === "npm" ? ["--no-audit", "--no-fund"] : []),
  ];

  if (!(await step(steps, "install", installer, installArgs, projectDir, timeout))) {
    return report(steps, "пакет не встал в чистый проект", spec, request, projectDir, []);
  }

  const installed = await installedPackage(projectDir);
  const entries = request.entries ?? (await declaredEntries(projectDir, installed?.name));

  if (entries.length === 0) {
    return report(steps, "проверять нечего: у поставки не нашлось ни одного подпути", spec, request, projectDir, entries, installed);
  }

  await writeFile(join(projectDir, "probe.mjs"), importScript(entries), "utf8");
  const imported = await step(steps, "import", process.execPath, ["probe.mjs"], projectDir, timeout);

  let typed = true;
  if (withTypes) {
    await writeFile(join(projectDir, "probe.ts"), importScript(entries), "utf8");
    await writeFile(join(projectDir, "tsconfig.json"), TSCONFIG, "utf8");
    typed = await step(
      steps,
      "typecheck",
      join(projectDir, "node_modules", ".bin", "tsc"),
      ["-p", "tsconfig.json"],
      projectDir,
      timeout,
    );
  }

  const summary = imported && typed ? "поставка встала и собралась в чистом проекте" : "поставка не прошла приёмку";
  return report(steps, summary, spec, request, projectDir, entries, installed);
}

function importScript(entries: readonly string[]): string {
  const lines = entries.map((entry, index) => `import * as entry${index} from ${JSON.stringify(entry)};`);
  const names = entries.map((_, index) => `entry${index}`).join(", ");
  return `${lines.join("\n")}\nconsole.log("подпутей:", [${names}].length);\n`;
}

async function installedPackage(projectDir: string): Promise<ProbeReport["installed"]> {
  const manifest = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  const name = Object.keys(manifest.dependencies ?? {}).find((key) => key !== "typescript");
  if (!name) return undefined;

  const installed = JSON.parse(
    await readFile(join(projectDir, "node_modules", ...name.split("/"), "package.json"), "utf8"),
  ) as { version?: string };

  return { name, version: installed.version ?? "неизвестна" };
}

async function declaredEntries(projectDir: string, name: string | undefined): Promise<readonly string[]> {
  if (!name) return [];

  const manifest = JSON.parse(
    await readFile(join(projectDir, "node_modules", ...name.split("/"), "package.json"), "utf8"),
  ) as { exports?: unknown };
  const exported = manifest.exports;

  if (typeof exported !== "object" || exported === null) return [name];

  const subpaths = Object.keys(exported).filter((key) => key.startsWith(".") && !key.includes("*"));
  if (subpaths.length === 0) return [name];

  return subpaths.map((subpath) => (subpath === "." ? name : `${name}/${subpath.slice(2)}`));
}

async function step(
  steps: ProbeStep[],
  stepName: string,
  file: string,
  args: readonly string[],
  cwd: string,
  timeout: number,
): Promise<boolean> {
  const command = `${file} ${args.join(" ")}`;
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);

  try {
    const { stdout, stderr } = await run(file, [...args], { cwd, timeout });
    steps.push({ name: stepName, ok: true, command, durationMs: elapsed(), output: tail(`${stdout}${stderr}`) });
    return true;
  } catch (error) {
    steps.push({ name: stepName, ok: false, command, durationMs: elapsed(), output: tail(outputOf(error)) });
    return false;
  }
}

function report(
  steps: readonly ProbeStep[],
  summary: string,
  spec: string,
  request: ProbeRequest,
  projectDir: string,
  entries: readonly string[],
  installed?: ProbeReport["installed"],
): Answer<ProbeReport> {
  const data: ProbeReport = {
    spec,
    ...(installed ? { installed } : {}),
    ...(request.registry ? { registry: request.registry } : {}),
    projectDir,
    entries,
    steps,
  };
  const broken = steps.find((current) => !current.ok);

  if (!broken) return done(summary, data);

  return failed(`${summary}: шаг «${broken.name}»`, {
    remedy: `повторите руками в ${projectDir}: ${broken.command}`,
    details: data,
  });
}

function outputOf(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error);
  const shaped = error as { stdout?: string; stderr?: string; message?: string };
  return `${shaped.stdout ?? ""}${shaped.stderr ?? ""}` || (shaped.message ?? String(error));
}

function tail(output: string, limit = 4000): string {
  const text = output.trim();
  return text.length > limit ? `…${text.slice(-limit)}` : text;
}
