import type { Answer } from "../answer/index";

export interface OptionDeclaration {
  /** Синтаксис флага вендора-парсера: `-r, --registry <url>`, `--dry-run`, `--tag [name]`. */
  readonly flags: string;
  readonly summary: string;
  /** Имя переменной окружения — второй слой после аргумента. */
  readonly env?: string;
  /** Путь в файле конфига через точку (`publish.registry`) — третий слой. */
  readonly config?: string;
  readonly default?: unknown;
  readonly required?: boolean;
  readonly choices?: readonly string[];
  readonly parse?: (raw: string, previous: unknown) => unknown;
}

export type OptionMap = Readonly<Record<string, OptionDeclaration>>;

export interface ArgumentDeclaration {
  readonly name: string;
  readonly summary: string;
  readonly required?: boolean;
  readonly variadic?: boolean;
}

type ValueFromFlags<F> = F extends `${string}<${string}`
  ? string
  : F extends `${string}[${string}`
    ? string | boolean
    : boolean;

type OptionValue<D> = D extends { parse: (raw: string, previous: never) => infer T }
  ? T
  : D extends { flags: infer F }
    ? ValueFromFlags<F>
    : never;

type Supplied<D> = D extends { required: true } ? true : D extends { default: unknown } ? true : false;

export type OptionValues<O extends OptionMap> = {
  readonly [K in keyof O]: Supplied<O[K]> extends true ? OptionValue<O[K]> : OptionValue<O[K]> | undefined;
};

type ArgumentValue<A> = A extends { variadic: true }
  ? readonly string[]
  : A extends { required: true }
    ? string
    : string | undefined;

export type ArgumentValues<A extends readonly ArgumentDeclaration[]> = {
  readonly [K in keyof A]: ArgumentValue<A[K]>;
};

export interface CommandInput<O extends OptionMap, A extends readonly ArgumentDeclaration[]> {
  readonly options: OptionValues<O>;
  readonly args: ArgumentValues<A>;
}

export interface CommandContext {
  /** Попросили машинный ответ (`--json`) — печать решает это, не тело команды. */
  readonly json: boolean;
  readonly cwd: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  /** Файл конфига, из которого разрешались настройки; `undefined` — файла не нашлось. */
  readonly configPath?: string;
}

export interface CommandDeclaration<
  O extends OptionMap = OptionMap,
  A extends readonly ArgumentDeclaration[] = readonly ArgumentDeclaration[],
  R = unknown,
> {
  readonly name: string;
  readonly summary: string;
  readonly args?: A;
  readonly options?: O;
  readonly aliases?: readonly string[];
  run(input: CommandInput<O, A>, context: CommandContext): Answer<R> | Promise<Answer<R>>;
}

export function defineCommand<
  const O extends OptionMap,
  const A extends readonly ArgumentDeclaration[],
  R,
>(declaration: CommandDeclaration<O, A, R>): CommandDeclaration<O, A, R> {
  return declaration;
}
