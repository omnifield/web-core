import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import { RailSections } from "#/widgets/rail";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(ui: () => ReturnType<typeof RailSections>) {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(ui, host);
  return host;
}

const controlsOf = (host: HTMLElement) =>
  [
    ...host.querySelectorAll<HTMLElement>(
      '[data-scope="accordion"][data-part="control"]',
    ),
  ] as HTMLElement[];

const items = [
  { value: "preset", label: "Пресет", children: <p>тело пресета</p> },
  { value: "manual", label: "Ручной ввод", children: <p>тело формы</p> },
];

describe("RailSections — секции рейла из списка", () => {
  it("на каждый пункт списка даёт свою секцию с её заголовком и содержимым", () => {
    const host = mount(() => <RailSections items={items} />);

    const controls = controlsOf(host);
    expect(controls.length).toBe(2);
    expect(controls[0]?.textContent).toContain("Пресет");
    expect(controls[1]?.textContent).toContain("Ручной ввод");
    expect(host.textContent).toContain("тело пресета");
    expect(host.textContent).toContain("тело формы");
  });

  it("раскрытой стоит названная секция, соседняя закрыта", () => {
    const host = mount(() => (
      <RailSections items={items} defaultValue={["manual"]} />
    ));

    const states = controlsOf(host).map((control) =>
      control.getAttribute("data-state"),
    );
    expect(states).toEqual(["closed", "open"]);
  });

  it("содержимое лежит на плоскости с отступом, а `padded: false` его снимает", () => {
    const host = mount(() => (
      <RailSections items={[items[0]!, { ...items[1]!, padded: false }]} />
    ));

    const paddings = [
      ...host.querySelectorAll<HTMLElement>('[data-scope="surface"]'),
    ].map((surface) => surface.style.padding);

    expect(paddings).toEqual(["var(--space-1)", "0px"]);
  });

  it("секция сама говорит, раскрыта ли она изначально", () => {
    const host = mount(() => (
      <RailSections
        items={[items[0]!, { ...items[1]!, open: true }]}
        multiple
      />
    ));

    expect(
      controlsOf(host).map((control) => control.getAttribute("data-state")),
    ).toEqual(["closed", "open"]);
  });

  it("названный снаружи набор сильнее флага на секции", () => {
    const host = mount(() => (
      <RailSections
        items={[items[0]!, { ...items[1]!, open: true }]}
        defaultValue={["preset"]}
        multiple
      />
    ));

    expect(
      controlsOf(host).map((control) => control.getAttribute("data-state")),
    ).toEqual(["open", "closed"]);
  });

  it("раскрытием можно управлять снаружи", () => {
    const [open, setOpen] = createSignal<string[]>([]);
    const host = mount(() => <RailSections items={items} value={open()} />);

    expect(
      controlsOf(host).map((control) => control.getAttribute("data-state")),
    ).toEqual(["closed", "closed"]);

    setOpen(["preset"]);

    expect(
      controlsOf(host).map((control) => control.getAttribute("data-state")),
    ).toEqual(["open", "closed"]);
  });
});
