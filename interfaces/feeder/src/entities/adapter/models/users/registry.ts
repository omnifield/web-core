import type { UserKind, UserPath } from "./types";

const declared = new Map<string, UserKind>();

export function defineUserKind<Args extends readonly unknown[]>(
  kind: string,
  address: (...args: Args) => readonly string[],
): UserKind<Args> {
  const known = declared.get(kind);
  if (known !== undefined) return known as UserKind<Args>;

  const one: UserKind<Args> = {
    kind,
    path: (...args) => [kind, ...address(...args)],
  };

  declared.set(kind, one as UserKind);

  return one;
}

export function userKinds(): readonly UserKind[] {
  return [...declared.values()];
}

export function userKindOf(path: UserPath): UserKind | undefined {
  const [kind] = path;
  return kind === undefined ? undefined : declared.get(kind);
}
