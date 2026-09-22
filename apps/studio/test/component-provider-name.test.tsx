// Провайдер компонента (`entities/component/model/context.tsx`) держит имя АКСЕССОРОМ и поддерево
// на смене имени не пересоздаёт. Раньше стоял `<Show keyed>`, и вместе с поддеревом умирало всё
// состояние внутри — в том числе раскрытие секций рейла, которое живёт в машине аккордеона.
//
// Сеть здесь не при чём, поэтому `entities/component/api` замокан целиком: проверяется реактивность
// провайдера, а не данные службы пресетов.

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComponentProvider, useComponent } from "#/entities/component";
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
  const { name } = useComponent();
  feed = useFeed();

  return (
    <>
      <p data-testid="name">{name()}</p>
      <p data-testid="feed">{String(feed.data() ?? "пусто")}</p>
    </>
  );
}

function mount() {
  const [name, setName] = createSignal("button");
  const host = document.createElement("div");
  document.body.append(host);

  mounts = 0;
  dispose = render(
    () => (
      <ComponentProvider name={name()}>
        <Probe />
      </ComponentProvider>
    ),
    host,
  );

  const textOf = (testid: string) =>
    host.querySelector<HTMLElement>(`[data-testid="${testid}"]`);

  return { host, setName, textOf };
}

describe("смена компонента не пересоздаёт поддерево провайдера", () => {
  it("узел переживает переход, а имя приезжает новое", () => {
    const { setName, textOf } = mount();
    const node = textOf("name");

    expect(node?.textContent).toBe("button");

    setName("accordion");

    expect(textOf("name")).toBe(node);
    expect(node?.textContent).toBe("accordion");
    expect(mounts).toBe(1);
  });

  it("доски компонентов не путаются: еда соседа ждёт возврата", () => {
    const { setName, textOf } = mount();

    feed?.serve("manual", "еда кнопки");
    expect(textOf("feed")?.textContent).toBe("еда кнопки");

    setName("accordion");
    expect(textOf("feed")?.textContent).toBe("пусто");

    feed?.serve("manual", "еда аккордеона");
    expect(textOf("feed")?.textContent).toBe("еда аккордеона");

    setName("button");
    expect(textOf("feed")?.textContent).toBe("еда кнопки");
  });
});
