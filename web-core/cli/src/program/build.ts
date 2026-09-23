import { Option, type Command } from "commander";

import type { CommandDeclaration, OptionDeclaration } from "../command/index";

export interface BoundOption {
  /** Ключ в декларации команды — под ним значение приезжает в `run`. */
  readonly key: string;
  /** Имя того же значения у вендора-парсера (`--dry-run` → `dryRun`). */
  readonly attribute: string;
  readonly declaration: OptionDeclaration;
}

export function buildCommand(target: Command, declaration: CommandDeclaration): readonly BoundOption[] {
  target.description(declaration.summary);
  for (const alias of declaration.aliases ?? []) target.alias(alias);

  for (const argument of declaration.args ?? []) {
    target.argument(argumentSyntax(argument), argument.summary);
  }

  return Object.entries(declaration.options ?? {}).map(([key, option]) => {
    const bound = new Option(option.flags, option.summary);

    if (option.env) bound.env(option.env);
    if (option.default !== undefined) bound.default(option.default);
    if (option.choices) bound.choices([...option.choices]);
    if (option.parse) bound.argParser(option.parse);

    target.addOption(bound);

    return { key, attribute: bound.attributeName(), declaration: option };
  });
}

function argumentSyntax(argument: { name: string; required?: boolean; variadic?: boolean }): string {
  const body = argument.variadic ? `${argument.name}...` : argument.name;
  return argument.required ? `<${body}>` : `[${body}]`;
}
