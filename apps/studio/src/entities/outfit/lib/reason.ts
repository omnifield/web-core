import { PresetsDown, PresetsRefused } from "@web-core/skin/presets";

/** Причина отказа — короткой строкой человеку, не в отладчик. */
export function reasonOf(cause: unknown): string {
  if (cause instanceof PresetsDown)
    return `${cause.message} · служба раздачи не отвечает`;
  if (cause instanceof PresetsRefused) return cause.message;
  return cause instanceof Error ? cause.message : String(cause);
}
