import { defineCommand } from "../command/index";
import { probeDelivery, type Installer } from "./delivery";

export function probeCommand(name = "probe") {
  return defineCommand({
    name,
    summary: "ставит опубликованный пакет в чистый проект вне репозитория, импортирует его подпути и проверяет типы",
    args: [
      { name: "package", summary: "имя пакета в реестре", required: true },
      { name: "version", summary: "версия или дист-тег, по умолчанию latest" },
    ],
    options: {
      registry: {
        flags: "--registry <url>",
        summary: "адрес реестра, откуда ставить",
        env: "NPM_CONFIG_REGISTRY",
        config: "probe.registry",
      },
      installer: {
        flags: "--installer <name>",
        summary: "чем ставить пакет",
        choices: ["npm", "pnpm", "yarn"],
        config: "probe.installer",
        default: "npm",
      },
      entry: {
        flags: "--entry <specifier>",
        summary: "подпуть для проверки, можно повторять; по умолчанию — все из exports пакета",
        parse: (raw: string, previous: unknown): readonly string[] => [
          ...(Array.isArray(previous) ? (previous as readonly string[]) : []),
          raw,
        ],
      },
      projectDir: {
        flags: "--project-dir <path>",
        summary: "куда развернуть чистый проект; по умолчанию — временная папка",
        config: "probe.projectDir",
      },
      types: {
        flags: "--no-types",
        summary: "не проверять типы установленного пакета",
      },
      typescript: {
        flags: "--typescript <range>",
        summary: "версия TypeScript для проверки типов",
        config: "probe.typescript",
        default: "latest",
      },
      timeout: {
        flags: "--timeout <ms>",
        summary: "предел на шаг пробы",
        config: "probe.timeout",
        parse: (raw: string): number => Number(raw),
      },
    },
    run({ options, args }) {
      return probeDelivery({
        name: args[0],
        ...(args[1] ? { version: args[1] } : {}),
        ...(options.registry ? { registry: options.registry } : {}),
        installer: options.installer as Installer,
        ...(options.entry ? { entries: options.entry } : {}),
        ...(options.projectDir ? { projectDir: options.projectDir } : {}),
        types: options.types,
        typescript: options.typescript,
        ...(options.timeout === undefined ? {} : { timeoutMs: options.timeout }),
      });
    },
  });
}
