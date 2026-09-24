#!/usr/bin/env web-core-node
import { defineCommand, runProgram } from "@web-core/cli";

import { workspaceRoot } from "./root";
import { verifyDelivery } from "./verify";

const verify = defineCommand({
  name: "verify",
  summary: "приёмка: поставить опубликованное в чистый проект вне репозитория и собрать",
  options: {
    registry: {
      flags: "--registry <url>",
      summary: "адрес реестра; по умолчанию — тот, что настроен в окружении",
      env: "NPM_CONFIG_REGISTRY",
    },
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
  summary: "приёмка поставки: единственный шаг выпуска, которого нет в графе задач",
  commands: [verify],
});
