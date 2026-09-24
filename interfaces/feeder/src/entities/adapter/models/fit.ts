export type Fit = "exact" | "safe" | "risky";

const TEXTUAL = new Set(["string"]);
const KNOWN = new Set(["string", "number", "boolean", "enum", "integer"]);

export function fitOf(from: string, to: string): Fit {
  if (from === to) return "exact";
  if (!KNOWN.has(from) || !KNOWN.has(to)) return "risky";
  if (TEXTUAL.has(to)) return "safe";
  return "risky";
}
