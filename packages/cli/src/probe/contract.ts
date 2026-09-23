export type Installer = "npm" | "pnpm" | "yarn";

export interface ProbeRequest {
  /** Что ставим: имя пакета, путь к тарболу — всё, что понимает установщик. Наш список пакетов тулзе неизвестен. */
  readonly name: string;
  readonly version?: string;
  readonly registry?: string;
  readonly installer?: Installer;
  /** Подпути для проверки; по умолчанию — всё, что установленный пакет объявил в `exports`. */
  readonly entries?: readonly string[];
  /** Куда развернуть чистый проект; по умолчанию — свежая временная папка. */
  readonly projectDir?: string;
  /** Ставить ли объявленные пакетом peer-зависимости перед импортом. */
  readonly peers?: boolean;
  /** Проверять ли типы (`tsc --noEmit` в чистом проекте). */
  readonly types?: boolean;
  readonly typescript?: string;
  readonly timeoutMs?: number;
}

/** Исход подпути: дефект поставки, поломка чужого пакета и предел самой пробы — разные вещи. */
export type EntryVerdict =
  | "ok"
  | "delivery-broken"
  | "dependency-undeclared"
  | "peer-missing"
  | "foreign-broken"
  | "node-refused";

/** Чем подпуть проверен: не всякий объявленный подпуть является модулем. */
export type EntryCheck = "import" | "json-import" | "file";

export interface EntryBlocker {
  readonly code?: string;
  readonly message: string;
  /** Пакет, в чьём файле случился отказ. */
  readonly culprit?: string;
  /** Пакет, чей файл вёл к отказавшему. */
  readonly importedBy?: string;
  /** Недостающий пакет — для `peer-missing` и `dependency-undeclared`. */
  readonly missing?: string;
  /** Для `peer-missing` — помечен ли peer как необязательный. */
  readonly optional?: boolean;
}

export interface EntryReport {
  readonly entry: string;
  readonly verdict: EntryVerdict;
  readonly checkedBy: EntryCheck;
  readonly resolved?: string;
  readonly durationMs: number;
  readonly blocker?: EntryBlocker;
}

export interface ProbeStep {
  readonly name: string;
  readonly ok: boolean;
  readonly command: string;
  readonly durationMs: number;
  readonly output?: string;
}

export interface InstalledPackage {
  readonly name: string;
  readonly version: string;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly peerDependencies: Readonly<Record<string, string>>;
  readonly optionalPeers: readonly string[];
  readonly entries: readonly string[];
}

export interface ProbeReport {
  /** Спецификатор, который реально ушёл установщику. */
  readonly spec: string;
  readonly installed?: { readonly name: string; readonly version: string };
  readonly registry?: string;
  readonly projectDir: string;
  readonly entries: readonly EntryReport[];
  /** Подпути, из-за которых приёмка красная. */
  readonly broken: readonly string[];
  /** Подпути, проверенные не до конца, — с названной причиной в своём `blocker`. */
  readonly limited: readonly string[];
  readonly steps: readonly ProbeStep[];
}

const BLOCKING: readonly EntryVerdict[] = ["delivery-broken", "dependency-undeclared", "foreign-broken"];

/** Необязательный peer, которого нет, — контракт пакета, а не поломка; обязательный — находка. */
export function isBlocking(entry: EntryReport): boolean {
  if (entry.verdict === "peer-missing") return entry.blocker?.optional !== true;
  return BLOCKING.includes(entry.verdict);
}

export function isLimited(entry: EntryReport): boolean {
  return !isBlocking(entry) && entry.verdict !== "ok";
}
