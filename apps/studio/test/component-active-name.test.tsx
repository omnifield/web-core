// Компонент адресуется активной ячейкой семьи (`entities/component/model/store.ts`), провайдера
// в приложении больше нет. Проверяются два свойства, ради которых он снимался: смена компонента
// не пересоздаёт поддерево читателя (имя приезжает новое, узел тот же) и доски компонентов при
// этом не путаются — еда соседа ждёт возврата.
//
// Сеть здесь ни при чём, поэтому `entities/component/api` замокан целиком.

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { componentStoreOf, useInfo } from "#/entities/component";
import { useFeed } from "#/entities/feed";

vi.mock("#/entities/component/api", () => {
  const idle = () => ({ data: [], isPending: false, error: null });
  return {
    variantsOf: Object.assign(() => Promise.resolve([]), { use: idle }),
    contentOf: Object.assign(() => Promise.resolve([]), { use: idle }),
  };
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

let mounts = 0;
let feed: ReturnType<typeof useFeed> | undefined;

function Probe() {
  mounts += 1;
  const { name } = useInfo();
  feed = useFeed(name);

  return (
    <>
      <p data-testid="name">{name()}</p>
      <p data-testid="feed">{String(feed.data() ?? "пусто")}</p>
    </>
  );
}

function mount() {
  const host = document.createElement("div");
  document.body.append(host);

  mounts = 0;
  componentStoreOf.activate("button");
  dispose = render(() => <Probe />, host);

  const textOf = (testid: string) =>
    host.querySelector<HTMLElement>(`[data-testid="${testid}"]`);

  return { host, textOf };
}

describe("активная ячейка вместо провайдера", () => {
  it("узел переживает смену компонента, а имя приезжает новое", () => {
    const { textOf } = mount();
    const node = textOf("name");

    expect(node?.textContent).toBe("button");

    componentStoreOf.activate("accordion");

    expect(textOf("name")).toBe(node);
    expect(node?.textContent).toBe("accordion");
    expect(mounts).toBe(1);
  });

  it("доски компонентов не путаются: еда соседа ждёт возврата", () => {
    const { textOf } = mount();

    feed?.serve("manual", "еда кнопки");
    expect(textOf("feed")?.textContent).toBe("еда кнопки");

    componentStoreOf.activate("accordion");
    expect(textOf("feed")?.textContent).toBe("пусто");

    feed?.serve("manual", "еда аккордеона");
    expect(textOf("feed")?.textContent).toBe("еда аккордеона");

    componentStoreOf.activate("button");
    expect(textOf("feed")?.textContent).toBe("еда кнопки");
  });
});
