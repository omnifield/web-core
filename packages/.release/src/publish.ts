import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";

import { done, failed, nothing, type Answer } from "@web-core/cli";

import { run } from "./run";

export interface Published {
  readonly registry?: string;
  readonly packages: readonly { readonly name: string; readonly version: string }[];
}

const SUMMARY = "pnpm-publish-summary.json";

export async function publishGroup(cwd: string, registry?: string): Promise<Answer<Published>> {
  await rm(join(cwd, SUMMARY), { force: true });

  const args = ["publish", "-r", "--report-summary", "--no-git-checks"];
  if (registry) args.push("--registry", registry);

  const ran = await run("pnpm", args, cwd);

  if (!ran.ok) {
    return failed("публикация отказала", {
      remedy: "проверьте токен и адрес реестра в окружении, затем повторите — публикация идемпотентна",
      details: { stderr: ran.stderr.trim(), stdout: ran.stdout.trim() },
    });
  }

  const packages = await readSummary(join(cwd, SUMMARY));

  if (packages.length === 0) {
    return nothing("новых версий в реестре не появилось — публиковать было нечего");
  }

  return done(
    `опубликовано пакетов: ${packages.length}`,
    registry ? { registry, packages } : { packages },
  );
}

async function readSummary(path: string): Promise<readonly { name: string; version: string }[]> {
  try {
    const body = JSON.parse(await readFile(path, "utf8")) as {
      publishedPackages?: readonly { name: string; version: string }[];
    };
    return body.publishedPackages ?? [];
  } catch {
    return [];
  }
}
