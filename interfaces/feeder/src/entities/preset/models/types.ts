export interface Preset {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly name?: string;
  readonly savedAt?: string;
  readonly content: unknown;
}
