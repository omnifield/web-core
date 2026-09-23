import { createContext, createSignal, Show, useContext, type Accessor, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { describe, expect, it } from "vitest";

// Фиксирует ЧУЖОЙ паттерн, не механику этой зоны — см. ROADMAP.yaml,
// composite-context-lost-for-label-control-positioner-recurrence.

const Branch = createContext<Accessor<boolean>>(() => false);

/** Форма Ark: `var TreeViewNodeContext = (props) => props.children(useTreeViewNodeContext())`. */
function CallsChildrenInBody(props: { children: (isBranch: Accessor<boolean>) => JSX.Element }) {
  // eslint-disable-next-line solid/reactivity -- анти-паттерн здесь и есть предмет пробы
  return props.children(useContext(Branch)) as unknown as JSX.Element;
}

/** Форма `TreeContent`/`TreeControl` — тот же флаг, прочитанный через `<Show>`. */
function ReadsWithShow() {
  const isBranch = useContext(Branch);
  return <Show when={isBranch()} fallback={<u data-shape="leaf" />}><b data-shape="branch" /></Show>;
}

describe("чтение флага: вызов children-функции в теле против <Show>", () => {
  it("callback-форма замирает на первом значении, <Show> переключается", () => {
    const [isBranch, setIsBranch] = createSignal(false);
    const host = document.createElement("div");
    document.body.append(host);

    render(
      () => (
        <Branch.Provider value={isBranch}>
          <CallsChildrenInBody>
            {(flag) => (flag() ? <i data-shape="branch" /> : <s data-shape="leaf" />)}
          </CallsChildrenInBody>
          <ReadsWithShow />
        </Branch.Provider>
      ),
      host,
    );

    const shapes = () => ({
      viaCallback: host.querySelector("i,s")?.getAttribute("data-shape"),
      viaShow: host.querySelector("b,u")?.getAttribute("data-shape"),
    });

    expect(shapes()).toEqual({ viaCallback: "leaf", viaShow: "leaf" });

    setIsBranch(true);

    expect(shapes()).toEqual({ viaCallback: "leaf", viaShow: "branch" });
  });
});
