import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { done, failed, nothing, type Answer } from "@web-core/cli";

import { git } from "./git";
import type { Target } from "./targets";
import { layTree } from "./tree";

export interface SyncRequest {
  readonly repo: string;
  readonly target: Target;
  readonly message?: string;
  /** Собрать и показать, что уедет, но не пушить. */
  readonly dryRun: boolean;
}

export interface Synced {
  readonly target: string;
  readonly url: string;
  readonly branch: string;
  readonly source: string;
  readonly revision: string;
  readonly files: number;
  readonly pushed: boolean;
}

export async function syncTarget(request: SyncRequest): Promise<Answer<Synced>> {
  const { repo, target } = request;
  const run = git(repo);

  const dirty = await run("status", "--porcelain");
  if (dirty.stdout !== "") {
    return failed("рабочее дерево не чистое", {
      remedy: "закоммитьте или отложите свои правки — синк отправляет коммит, а не рабочее дерево",
      details: { files: dirty.stdout.split("\n").length },
    });
  }

  const revision = (await run("rev-parse", "--short", target.source)).stdout;
  if (revision === "") {
    return failed(`ветка «${target.source}» не найдена`, { remedy: "проверьте `source` в `sync-targets.yaml`" });
  }

  const reachable = await run("ls-remote", target.url);
  if (!reachable.ok) {
    return failed(`до ${target.url} не достучаться`, {
      remedy: "проверьте адрес и доступ (для приватного репозитория нужны учётные данные)",
      details: { stderr: reachable.stderr },
    });
  }

  const remote = `sync-${target.name}`;
  await (await run("remote", "get-url", remote)).ok
    ? await run("remote", "set-url", remote, target.url)
    : await run("remote", "add", remote, target.url);

  const exists = (await run("ls-remote", "--heads", target.url, target.branch)).stdout !== "";
  const worktree = await mkdtemp(join(tmpdir(), `sync-${target.name}-`));
  const local = `sync/${target.name}`;

  try {
    const prepared = exists
      ? await fromRemote(repo, worktree, local, remote, target.branch)
      : await fromScratch(repo, worktree, local, target.source);
    if (prepared.outcome === "failed") return prepared;

    const laid = await layTree(repo, worktree, target);
    if (laid.outcome !== "done") return laid;
    if (laid.data === 0) return nothing(`цель «${target.name}» уже совпадает с ${target.source}@${revision}`);

    const message = request.message ?? `sync: ${target.source}@${revision}`;
    const committed = await git(worktree)("commit", "--no-verify", "-m", message);
    if (!committed.ok) {
      return failed("не вышло записать коммит в цели", { details: { stderr: committed.stderr } });
    }

    const report: Synced = {
      target: target.name,
      url: target.url,
      branch: target.branch,
      source: target.source,
      revision,
      files: laid.data,
      pushed: false,
    };

    if (request.dryRun) {
      return done(`готово к отправке: ${laid.data} файлов в ${target.branch} (не отправлено)`, report);
    }

    const pushed = await git(worktree)("push", remote, `${local}:${target.branch}`);
    if (!pushed.ok) {
      return failed("отправка отказала", {
        remedy: "если ветка цели ушла вперёд — подтяните её и повторите; силой не перезаписываем",
        details: { stderr: pushed.stderr },
      });
    }

    return done(`отправлено: ${laid.data} файлов в ${target.branch}`, { ...report, pushed: true });
  } finally {
    await git(repo)("worktree", "remove", "--force", worktree);
    await git(repo)("branch", "-D", local);
    await rm(worktree, { recursive: true, force: true });
  }
}

async function fromRemote(
  repo: string,
  worktree: string,
  local: string,
  remote: string,
  branch: string,
): Promise<Answer<undefined>> {
  const run = git(repo);

  const fetched = await run("fetch", remote, branch);
  if (!fetched.ok) return failed(`не вышло забрать ${remote}/${branch}`, { details: { stderr: fetched.stderr } });

  const added = await run("worktree", "add", "-B", local, worktree, `${remote}/${branch}`);
  return added.ok
    ? done("ветка цели взята за основу")
    : failed("не вышло развернуть рабочую копию цели", { details: { stderr: added.stderr } });
}

async function fromScratch(
  repo: string,
  worktree: string,
  local: string,
  source: string,
): Promise<Answer<undefined>> {
  const run = git(repo);

  const added = await run("worktree", "add", "--detach", worktree, source);
  if (!added.ok) return failed("не вышло развернуть рабочую копию", { details: { stderr: added.stderr } });

  const orphan = await git(worktree)("checkout", "--orphan", local);
  if (!orphan.ok) return failed("не вышло начать ветку цели с нуля", { details: { stderr: orphan.stderr } });

  // Чистим и ДИСК, а не только индекс: рабочая копия развёрнута из нашей ветки, и всё, что
  // осталось бы лежать файлами, вернул бы обратно `git add -A` при раскладке — в пустую цель
  // уехало бы целиком наше дерево, а не выбранные пути.
  const cleared = await git(worktree)("rm", "-rf", "--quiet", ".");
  return cleared.ok
    ? done("ветки на цели ещё нет — начинаем с нуля")
    : failed("не вышло очистить рабочую копию новой ветки", { details: { stderr: cleared.stderr } });
}
