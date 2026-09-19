export function newTag(): string {
  return crypto.randomUUID().slice(0, 8);
}
