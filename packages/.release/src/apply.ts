import { done, failed, type Answer } from "@web-core/cli";

import { readPlan, type Plan } from "./plan";
import { run } from "./run";

export async function applyPlan(cwd: string): Promise<Answer<Plan>> {
  const planned = await readPlan(cwd);
  if (planned.outcome !== "done") return planned;

  const ran = await run("pnpm", ["version", "-r"], cwd);

  if (!ran.ok) {
    return failed("версии не поднялись", {
      remedy: "дерево могло остаться наполовину правленым — сверьте `git status` перед повтором",
      details: { stderr: ran.stderr.trim(), stdout: ran.stdout.trim() },
    });
  }

  const left = await readPlan(cwd);
  if (left.outcome === "done") {
    return failed("интенты остались непримененными", {
      remedy: "прогоните `pnpm version -r` руками и прочитайте вывод",
      details: { stillPlanned: left.data.packages.map((item) => item.name) },
    });
  }

  return done(`поднято до ${planned.data.version}: ${planned.data.packages.length} пакетов`, planned.data);
}
