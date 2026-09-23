import type { Answer } from "./index";

export interface ExitCodes {
  readonly done: number;
  readonly nothing: number;
  readonly failed: number;
  readonly usage: number;
}

// Почему `nothing` по умолчанию 0, а не свой код — FAQ.md, «делать нечего».
export const DEFAULT_EXIT_CODES: ExitCodes = {
  done: 0,
  nothing: 0,
  failed: 1,
  usage: 2,
};

export function exitCodeFor<T>(answer: Answer<T>, codes: ExitCodes = DEFAULT_EXIT_CODES): number {
  return codes[answer.outcome];
}

export function withExitCodes(overrides: Partial<ExitCodes> | undefined): ExitCodes {
  return { ...DEFAULT_EXIT_CODES, ...overrides };
}
