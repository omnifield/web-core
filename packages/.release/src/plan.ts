import { done, failed, nothing, type Answer } from "@web-core/cli";

import { run } from "./run";

export interface PlannedPackage {
  readonly name: string;
  readonly from: string;
  readonly to: string;
  readonly bump: string;
  readonly via: string;
}

export interface Plan {
  readonly version: string;
  readonly packages: readonly PlannedPackage[];
}

// Почему план разбирается из текста, а не берётся `--json` — README.md, «Цена сценария».
const ROW = /^\s{2}(?<name>\S+):\s(?<from>\S+)\s→\s(?<to>\S+)\s\((?<bump>[^,]+),\svia\s(?<via>[^)]+)\)/u;

export function parsePlan(stdout: string): readonly PlannedPackage[] {
  const rows: PlannedPackage[] = [];

  for (const line of stdout.split("\n")) {
    const found = ROW.exec(line)?.groups;
    if (found) {
      rows.push({
        name: found["name"] ?? "",
        from: found["from"] ?? "",
        to: found["to"] ?? "",
        bump: found["bump"] ?? "",
        via: found["via"] ?? "",
      });
    }
  }

  return rows;
}

export async function readPlan(cwd: string): Promise<Answer<Plan>> {
  const ran = await run("pnpm", ["version", "-r", "--dry-run"], cwd);

  if (!ran.ok) {
    return failed("план выпуска не собрался", {
      remedy: "прогоните `pnpm version -r --dry-run` руками и прочитайте отказ целиком",
      details: { stderr: ran.stderr.trim(), stdout: ran.stdout.trim() },
    });
  }

  if (/No pending changes/u.test(ran.stdout)) {
    return nothing("интентов нет — выпускать нечего");
  }

  const packages = parsePlan(ran.stdout);

  if (packages.length === 0) {
    return failed("план собрался, но разобрать его не вышло", {
      remedy: "формат вывода pnpm изменился — сверьте разбор в `.release/src/plan.ts`",
      details: { stdout: ran.stdout.trim() },
    });
  }

  const version = packages[0]?.to ?? "";

  return done(`выпуск ${version}: ${packages.length} пакетов`, { version, packages });
}
