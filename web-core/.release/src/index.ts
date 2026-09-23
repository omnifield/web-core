#!/usr/bin/env web-core-node
import { defineCommand, runProgram } from "@web-core/cli";

import { applyPlan } from "./apply";
import { readPlan } from "./plan";
import { publishGroup } from "./publish";
import { workspaceRoot } from "./root";
import { verifyDelivery } from "./verify";

const registry = {
  flags: "--registry <url>",
  summary: "адрес реестра; по умолчанию — тот, что настроен в окружении",
  env: "NPM_CONFIG_REGISTRY",
} as const;

const plan = defineCommand({
  name: "plan",
  summary: "что выпустится и какой версией — ничего не меняет на диске",
  options: {},
  args: [],
  run: (_input, context) => readPlan(workspaceRoot(context.cwd)),
});

const version = defineCommand({
  name: "version",
  summary: "применить план: версии, CHANGELOG, журнал интентов. Коммита и тега не делает",
  options: {},
  args: [],
  run: (_input, context) => applyPlan(workspaceRoot(context.cwd)),
});

const publish = defineCommand({
  name: "publish",
  summary: "опубликовать группу в реестр из окружения и отчитаться, что уехало",
  options: { registry },
  args: [],
  run: ({ options }, context) => publishGroup(workspaceRoot(context.cwd), options.registry),
});

const verify = defineCommand({
  name: "verify",
  summary: "приёмка: поставить опубликованное в чистый проект вне репозитория и собрать",
  options: {
    registry,
    only: { flags: "--only <package>", summary: "проверить один пакет вместо всей группы" },
    types: { flags: "--no-types", summary: "не проверять типы в чистом проекте", default: true },
  },
  args: [],
  run: ({ options }, context) =>
    verifyDelivery({
      cwd: workspaceRoot(context.cwd),
      types: options.types !== false,
      ...(options.registry ? { registry: options.registry } : {}),
      ...(options.only ? { only: options.only } : {}),
    }),
});

process.exitCode = await runProgram({
  name: "web-core-release",
  summary: "сценарий выпуска группы web-core/",
  commands: [plan, version, publish, verify],
});
