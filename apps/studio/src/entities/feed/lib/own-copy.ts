/** Своя копия еды: чужой стор отдаёт прокси, а immer морозит положенное. Разбор — FAQ.md. */
export function ownCopy(data: unknown): unknown {
  return data === undefined ? undefined : JSON.parse(JSON.stringify(data));
}
