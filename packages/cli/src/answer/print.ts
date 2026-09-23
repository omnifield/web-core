import type { Answer } from "./index";

export interface AnswerChannel {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
}

export interface PrintOptions {
  readonly json?: boolean;
  readonly channel?: AnswerChannel;
}

const MARK: Record<Answer<unknown>["outcome"], string> = {
  done: "✔",
  nothing: "•",
  failed: "✖",
};

export const processChannel: AnswerChannel = {
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
};

export function printAnswer<T>(answer: Answer<T>, options: PrintOptions = {}): void {
  const channel = options.channel ?? processChannel;

  if (options.json) {
    channel.out(JSON.stringify(answer));
    return;
  }

  const line = `${MARK[answer.outcome]} ${answer.summary}`;

  if (answer.outcome !== "failed") {
    channel.out(line);
    return;
  }

  channel.err(line);
  if (answer.remedy) channel.err(`  → ${answer.remedy}`);
}
