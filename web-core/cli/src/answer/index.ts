export type Outcome = "done" | "nothing" | "failed";

export interface DoneAnswer<T> {
  readonly outcome: "done";
  readonly summary: string;
  readonly data: T;
}

export interface NothingAnswer {
  readonly outcome: "nothing";
  readonly summary: string;
}

export interface FailedAnswer {
  readonly outcome: "failed";
  readonly summary: string;
  readonly remedy?: string;
  readonly details?: unknown;
}

export type Answer<T = undefined> = DoneAnswer<T> | NothingAnswer | FailedAnswer;

export function done<T>(summary: string, data: T): DoneAnswer<T>;
export function done(summary: string): DoneAnswer<undefined>;
export function done<T>(summary: string, data?: T): DoneAnswer<T | undefined> {
  return { outcome: "done", summary, data };
}

export function nothing(summary: string): NothingAnswer {
  return { outcome: "nothing", summary };
}

export function failed(summary: string, rest: Omit<FailedAnswer, "outcome" | "summary"> = {}): FailedAnswer {
  return { outcome: "failed", summary, ...rest };
}

export function isFailed<T>(answer: Answer<T>): answer is FailedAnswer {
  return answer.outcome === "failed";
}
