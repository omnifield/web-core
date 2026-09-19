export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly content: unknown;
}
