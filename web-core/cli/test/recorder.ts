import type { AnswerChannel } from "../src/answer/print";

export interface Recorder {
  readonly channel: AnswerChannel;
  readonly out: string[];
  readonly err: string[];
}

export function recorder(): Recorder {
  const out: string[] = [];
  const err: string[] = [];

  return {
    out,
    err,
    channel: {
      out: (line) => void out.push(line),
      err: (line) => void err.push(line),
    },
  };
}
