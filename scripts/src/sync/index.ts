#!/usr/bin/env web-core-node
import { defineCommand, done, failed, runProgram } from "@web-core/cli";

import { repoRoot } from "./root";
import { syncTarget } from "./run";
import { readTargets } from "./targets";

// `--config` движок занимает под свой файл настроек, поэтому файл целей зовётся иначе.
const targetsFile = {
  flags: "--targets <path>",
  summary: "файл целей вместо `sync-targets.yaml`",
  env: "SYNC_TARGETS",
  default: "sync-targets.yaml",
} as const;

const list = defineCommand({
  name: "targets",
  summary: "какие цели настроены и что в них уезжает",
  args: [],
  options: { targets: targetsFile },
  async run({ options }, context) {
    const targets = await readTargets(repoRoot(context.cwd), options.targets);

    return targets.list.length === 0
      ? failed("целей не настроено", { remedy: `опишите цель в ${options.targets}` })
      : done(`целей: ${targets.list.length}`, targets.list);
  },
});

const send = defineCommand({
  name: "send",
  summary: "отправить выбранные пути в ветку цели (в рабочую ветку цели не пишем никогда)",
  args: [{ name: "target", summary: "имя цели из файла целей", required: true }],
  options: {
    targets: targetsFile,
    message: { flags: "--message <text>", summary: "сообщение коммита в цели" },
    dryRun: { flags: "--dry-run", summary: "собрать и показать, что уедет, но не отправлять" },
  },
  async run({ options, args }, context) {
    const targets = await readTargets(repoRoot(context.cwd), options.targets);
    const target = targets.list.find((item) => item.name === args[0]);

    if (!target) {
      return failed(`цель «${args[0]}» не описана`, {
        remedy: `известные цели: ${targets.list.map((item) => item.name).join(", ") || "ни одной"}`,
      });
    }

    if (target.include.length === 0) {
      return failed(`у цели «${target.name}» не названо, что отправлять`, {
        remedy: "добавьте `include: [путь, …]` — без него в цель не уедет ничего",
      });
    }

    return syncTarget({
      repo: repoRoot(context.cwd),
      target,
      dryRun: options.dryRun === true,
      ...(options.message ? { message: options.message } : {}),
    });
  },
});

process.exitCode = await runProgram({
  name: "sync",
  summary: "отправка работы во внешние репозитории",
  commands: [list, send],
});
