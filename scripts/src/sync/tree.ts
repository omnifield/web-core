import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { done, failed, type Answer } from "@web-core/cli";

import { git } from "./git";
import type { Target } from "./targets";

const exec = promisify(execFile);

/** Содержимое цели собирается ЗАМЕНОЙ своих путей, а не мержем: чужое в цели синк не трогает. */
export async function layTree(repo: string, worktree: string, target: Target): Promise<Answer<number>> {
  const run = git(worktree);

  const carried = target.strip ? await topLevelOf(repo, target) : target.include;
  if (!carried) return failed(`не вышло прочитать содержимое «${target.strip}» в исходной ветке`);

  for (const path of carried) {
    const cleared = await run("rm", "-r", "--ignore-unmatch", "--quiet", "--", path);
    if (!cleared.ok) {
      return failed(`не вышло очистить «${path}» в цели`, { details: { stderr: cleared.stderr } });
    }
  }

  const folder = await mkdtemp(join(tmpdir(), "sync-tree-"));
  const bundle = join(folder, "include.tar");

  // Исключения — pathspec'ом самого git: файл не попадает в архив вовсе, а не удаляется потом.
  const packed = await git(repo)(
    "archive",
    "--format=tar",
    `--output=${bundle}`,
    target.source,
    "--",
    ...target.include,
    ...target.exclude.map((mask) => `:(exclude)${mask}`),
  );

  if (!packed.ok) {
    await rm(folder, { recursive: true, force: true });
    return failed("не вышло собрать список файлов для отправки", {
      remedy: "проверьте `include` в `sync-targets.yaml` — путь должен существовать в исходной ветке",
      details: { source: target.source, include: target.include, stderr: packed.stderr },
    });
  }

  const spread = await untar(bundle, worktree, depthOf(target.strip));
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

async function untar(bundle: string, into: string, strip: number): Promise<{ ok: boolean; stderr: string }> {
  const level = strip > 0 ? [`--strip-components=${strip}`] : [];

  try {
    await exec("tar", ["-xf", bundle, "-C", into, ...level]);
    return { ok: true, stderr: "" };
  } catch (error) {
    return { ok: false, stderr: (error as { message?: string }).message ?? "" };
  }
}

function depthOf(strip: string): number {
  return strip ? strip.split("/").filter(Boolean).length : 0;
}

/** Что окажется в КОРНЕ цели после снятия префикса — по нему и чистим её перед раскладкой. */
async function topLevelOf(repo: string, target: Target): Promise<readonly string[] | null> {
  const listed = await git(repo)("ls-tree", "--name-only", target.source, `${target.strip}/`);
  if (!listed.ok) return null;

  const depth = depthOf(target.strip);

  return listed.stdout
    .split("\n")
    .filter(Boolean)
    .map((path) => path.split("/").slice(depth).join("/"))
    .filter(Boolean);
}
