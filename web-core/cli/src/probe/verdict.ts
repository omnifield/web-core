import type { EntryBlocker, EntryReport, EntryVerdict, InstalledPackage } from "./contract";
import type { ProbeRecord } from "./runner";

/** Коды, которыми Node отвечает на резолюцию и загрузку: они говорят про поставку, а не про код пакета. */
const LOADING_CODES: ReadonlySet<string> = new Set([
  "ERR_MODULE_NOT_FOUND",
  "ERR_PACKAGE_PATH_NOT_EXPORTED",
  "ERR_PACKAGE_IMPORT_NOT_DEFINED",
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "ERR_INVALID_PACKAGE_TARGET",
  "ERR_INVALID_PACKAGE_CONFIG",
  "ERR_UNKNOWN_FILE_EXTENSION",
  "ERR_IMPORT_ATTRIBUTE_MISSING",
  "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED",
  "ERR_REQUIRE_ESM",
]);

export function reportFor(record: ProbeRecord, installed?: InstalledPackage): EntryReport {
  const common = {
    entry: record.entry,
    checkedBy: record.checkedBy,
    ...(record.resolved ? { resolved: record.resolved } : {}),
    durationMs: record.durationMs,
  };

  if (record.ok) return { ...common, verdict: "ok" };

  const blocker = blockerOf(record, installed);
  return { ...common, verdict: verdictOf(record, blocker, installed), blocker };
}

function verdictOf(record: ProbeRecord, blocker: EntryBlocker, installed?: InstalledPackage): EntryVerdict {
  if (record.phase !== "import") return "delivery-broken";

  if (blocker.missing) {
    if (installed && blocker.missing in installed.peerDependencies) return "peer-missing";
    if (installed && blocker.missing in installed.dependencies) return "delivery-broken";
    return "dependency-undeclared";
  }

  const loading = (record.code && LOADING_CODES.has(record.code)) || record.kind === "SyntaxError";
  if (!loading) return "node-refused";

  return blocker.culprit && installed && blocker.culprit !== installed.name ? "foreign-broken" : "delivery-broken";
}

function blockerOf(record: ProbeRecord, installed?: InstalledPackage): EntryBlocker {
  const message = firstLine(record.message ?? "");
  const missing = /Cannot find package '([^']+)'/.exec(message)?.[1];
  const importer = packageOf(/imported from (\S+)/.exec(record.message ?? "")?.[1]);
  const culprit = packageOf(targetPathOf(record));
  const optional = missing === undefined ? undefined : installed?.optionalPeers.includes(missing);

  return {
    ...(record.code ? { code: record.code } : {}),
    message,
    ...(culprit ? { culprit } : {}),
    ...(importer && importer !== culprit ? { importedBy: importer } : {}),
    ...(missing ? { missing } : {}),
    ...(optional === undefined ? {} : { optional }),
  };
}

/** Файл, на котором отказ случился: цель из сообщения, иначе первый след пакета в стеке. */
function targetPathOf(record: ProbeRecord): string | undefined {
  const message = record.message ?? "";
  const quoted = /'([^']*node_modules\/[^']+)'/.exec(message)?.[1];
  if (quoted) return quoted;

  const inMessage = /(\S*node_modules\/\S+)/.exec(message.replace(/imported from \S+/, ""))?.[1];
  if (inMessage) return inMessage;

  return /(\S*node_modules\/\S+)/.exec(record.stack ?? "")?.[1];
}

function packageOf(path: string | undefined): string | undefined {
  if (!path) return undefined;

  const tail = path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length);
  const parts = tail.split("/");
  const name = tail.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];

  return name && name !== path ? name : undefined;
}

function firstLine(message: string): string {
  return message.split("\n")[0]?.trim() ?? "";
}
