import { describe, expect, it } from "vitest";

import { done, failed, isFailed, nothing } from "../src/answer/index";
import { DEFAULT_EXIT_CODES, exitCodeFor, withExitCodes } from "../src/answer/exit";
import { printAnswer } from "../src/answer/print";
import { recorder } from "./recorder";

describe("конверт ответа", () => {
  it("несёт данные в `done` и ничего лишнего в `nothing`", () => {
    expect(done("собрано", { files: 3 })).toEqual({ outcome: "done", summary: "собрано", data: { files: 3 } });
    expect(nothing("нечего публиковать")).toEqual({ outcome: "nothing", summary: "нечего публиковать" });
  });

  it("`failed` держит и причину, и что делать дальше", () => {
    const answer = failed("реестр не ответил", { remedy: "проверьте --registry", details: { status: 502 } });

    expect(isFailed(answer)).toBe(true);
    expect(answer.remedy).toBe("проверьте --registry");
    expect(answer.details).toEqual({ status: 502 });
  });
});

describe("коды возврата", () => {
  it("«делать нечего» по умолчанию не валит пайплайн", () => {
    expect(exitCodeFor(nothing("изменений нет"))).toBe(0);
    expect(DEFAULT_EXIT_CODES.nothing).toBe(0);
  });

  it("отказ и неверное употребление различаются", () => {
    expect(exitCodeFor(failed("отказ"))).toBe(1);
    expect(DEFAULT_EXIT_CODES.usage).toBe(2);
  });

  it("числа переопределяются целиком поштучно", () => {
    const codes = withExitCodes({ nothing: 3 });

    expect(exitCodeFor(nothing("изменений нет"), codes)).toBe(3);
    expect(codes.failed).toBe(1);
  });
});

describe("печать конверта", () => {
  it("человеку — строка со значком, машине — тот же конверт JSON'ом", () => {
    const human = recorder();
    const machine = recorder();

    printAnswer(done("собрано", { files: 3 }), { channel: human.channel });
    printAnswer(done("собрано", { files: 3 }), { channel: machine.channel, json: true });

    expect(human.out).toEqual(["✔ собрано"]);
    expect(JSON.parse(machine.out[0] ?? "")).toEqual({
      outcome: "done",
      summary: "собрано",
      data: { files: 3 },
    });
  });

  it("отказ уходит в поток ошибок вместе с подсказкой", () => {
    const recorded = recorder();

    printAnswer(failed("реестр не ответил", { remedy: "проверьте --registry" }), {
      channel: recorded.channel,
    });

    expect(recorded.out).toEqual([]);
    expect(recorded.err).toEqual(["✖ реестр не ответил", "  → проверьте --registry"]);
  });
});
