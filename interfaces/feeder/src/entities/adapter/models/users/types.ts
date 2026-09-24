export type UserPath = readonly string[];

export interface UserKind<Args extends readonly unknown[] = readonly unknown[]> {
  readonly kind: string;
  path(...args: Args): UserPath;
}
