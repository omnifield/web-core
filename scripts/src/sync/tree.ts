import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { done, failed, type Answer } from "@web-core/cli";

import { git } from "./git";
import type { Target } from "./targets";

const exec = promisify(execFile);

/**
 * Содержимое цели собирается ЗАМЕНОЙ своих путей, а не мержем всего дерева: то, что цель держит
 * у себя (свой корень, свои конфиги), синк не трогает — разбор в `scripts/README.md`.
 */
export async function layTree(repo: string, worktree: string, target: Target): Promise<Answer<number>> {
  const run = git(worktree);

  for (const path of target.include) {
    const cleared = await run("rm", "-r", "--ignore-unmatch", "--quiet", "--", path);
    if (!cleared.ok) {
      return failed(`не вышло очистить «${path}» в цели`, { details: { stderr: cleared.stderr } });
    }
  }

  const folder = await mkdtemp(join(tmpdir(), "sync-tree-"));
  const bundle = join(folder, "include.tar");

  const packed = await git(repo)(
    "archive",
    "--format=tar",
    `--output=${bundle}`,
    target.source,
    "--",
    ...target.include,
  );

  if (!packed.ok) {
    await rm(folder, { recursive: true, force: true });
    return failed("не вышло собрать список файлов для отправки", {
      remedy: "проверьте `include` в `sync-targets.yaml` — путь должен существовать в исходной ветке",
      details: { source: target.source, include: target.include, stderr: packed.stderr },
    });
  }

  const spread = await untar(bundle, worktree);
  await rm(folder, { recursive: true, force: true });
  if (!spread.ok) return failed("не вышло разложить файлы в цели", { details: { stderr: spread.stderr } });

  for (const path of target.ignore) {
    await rm(join(worktree, path), { recursive: true, force: true });
  }

  const staged = await run("add", "-A");
  if (!staged.ok) return failed("не вышло подготовить коммит в цели", { details: { stderr: staged.stderr } });

  const diff = await run("diff", "--cached", "--name-only");
  const changed = diff.stdout.split("\n").filter(Boolean).length;

  return done(`файлов к отправке: ${changed}`, changed);
}

async function untar(bundle: string, into: string): Promise<{ ok: boolean; stderr: string }> {
  try {
    await exec("tar", ["-xf", bundle, "-C", into]);
    return { ok: true, stderr: "" };
  } catch (error) {
    return { ok: false, stderr: (error as { message?: string }).message ?? "" };
  }
}
