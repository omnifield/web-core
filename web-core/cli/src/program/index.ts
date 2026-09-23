import { Command, CommanderError } from "commander";

import { failed, type Answer } from "../answer/index";
import { exitCodeFor, withExitCodes, type ExitCodes } from "../answer/exit";
import { printAnswer, processChannel, type AnswerChannel } from "../answer/print";
import type { CommandContext, CommandDeclaration } from "../command/index";
import { loadConfig } from "../settings/index";
import { buildCommand, type BoundOption } from "./build";
import { resolveOptions } from "./resolve";

export interface ProgramDeclaration {
  readonly name: string;
  readonly summary: string;
  readonly version?: string;
  readonly commands: readonly CommandDeclaration[];
  readonly exitCodes?: Partial<ExitCodes>;
  /** Имя, под которым ищется файл конфига; по умолчанию — имя программы. */
  readonly configName?: string;
}

export interface RunProgramOptions {
  /** Аргументы пользователя без `node` и пути к скрипту; по умолчанию — `process.argv.slice(2)`. */
  readonly argv?: readonly string[];
  readonly channel?: AnswerChannel;
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

interface Executed {
  readonly answer: Answer<unknown>;
  readonly usage: boolean;
  readonly json: boolean;
}

export async function runProgram(
  declaration: ProgramDeclaration,
  options: RunProgramOptions = {},
): Promise<number> {
  const channel = options.channel ?? processChannel;
  const codes = withExitCodes(declaration.exitCodes);
  const program = new Command(declaration.name).description(declaration.summary);

  program.exitOverride();
  program.configureOutput({
    writeOut: (text) => channel.out(trimEnd(text)),
    writeErr: (text) => channel.err(trimEnd(text)),
    outputError: () => {},
  });
  if (declaration.version) program.version(declaration.version);

  let executed: Executed | undefined;
  const solo = declaration.commands.length === 1 && declaration.commands[0]?.name === declaration.name;

  for (const command of declaration.commands) {
    const target = solo ? program : program.command(command.name);
    const bound = buildCommand(target, command);

    target.option("--json", "ответ одним конвертом для машины, а не для человека");
    target.option("--config <path>", "путь к файлу конфига вместо поиска по умолчанию");
    target.action(async () => {
      executed = await execute(target, command, bound, declaration, options);
    });
  }

  try {
    await program.parseAsync([...(options.argv ?? process.argv.slice(2))], { from: "user" });
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.exitCode === 0) return 0;
      printAnswer(failed(error.message, { remedy: `справка: ${declaration.name} --help` }), { channel });
      return codes.usage;
    }
    throw error;
  }

  if (!executed) return codes.usage;

  printAnswer(executed.answer, { json: executed.json, channel });
  return executed.usage ? codes.usage : exitCodeFor(executed.answer, codes);
}

async function execute(
  target: Command,
  command: CommandDeclaration,
  bound: readonly BoundOption[],
  program: ProgramDeclaration,
  options: RunProgramOptions,
): Promise<Executed> {
  const cwd = options.cwd ?? process.cwd();
  const globals = target.opts();
  const config = await loadConfig(program.configName ?? program.name, {
    path: typeof globals["config"] === "string" ? globals["config"] : undefined,
    cwd,
  });
  const { values, missing } = resolveOptions(target, bound, config);
  const json = Boolean(globals["json"]);

  if (missing.length > 0) {
    return {
      usage: true,
      json,
      answer: failed(`нечем взять настройку: ${missing.join(", ")}`, {
        remedy: "передайте флагом, переменной окружения или строкой в файле конфига",
      }),
    };
  }

  const context: CommandContext = {
    json,
    cwd,
    env: options.env ?? process.env,
    ...(config.path ? { configPath: config.path } : {}),
  };

  try {
    const answer = await command.run({ options: values, args: target.processedArgs } as never, context);
    return { answer, usage: false, json };
  } catch (error) {
    return {
      usage: false,
      json,
      answer: failed(messageOf(error), {
        remedy: "команда прервалась на исключении — повторите с `--json`, чтобы забрать подробности",
        details: detailsOf(error),
      }),
    };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function detailsOf(error: unknown): unknown {
  return error instanceof Error ? { name: error.name, stack: error.stack } : error;
}

function trimEnd(text: string): string {
  return text.replace(/\n+$/u, "");
}
