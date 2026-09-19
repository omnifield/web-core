import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Presets, presetsStore } from "../../../src/entities/preset";

interface Content {
  readonly items: string[];
}

function asContent(value: unknown): Content | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const content = value as Partial<Content>;
  return Array.isArray(content.items) ? { items: content.items } : undefined;
}

let dispose: (() => void) | undefined;

beforeEach(() => {
  presetsStore.actions.hydrate([]);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(children: Parameters<typeof Presets<Content>>[0]["children"]): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => (
      <Presets
        kind="свой"
        as={asContent}
        empty="Своих записей пока нет"
        broken="Запись не наша"
      >
        {children}
      </Presets>
    ),
    host,
  );
  return host;
}

function line(preset: () => { name: string }): string {
  return preset().name;
}

describe("Presets", () => {
  it("пустой список объясняет себя словами потребителя, а не пустотой", () => {
    presetsStore.actions.add("чужой", "не моя", { items: [] });

    const host = mount((preset) => <span>{line(preset)}</span>);

    expect(host.textContent).toContain("Своих записей пока нет");
    expect(host.textContent).not.toContain("не моя");
  });

  it("показывает записи своего вида и не показывает чужие", () => {
    presetsStore.actions.add("свой", "моя", { items: [] });
    presetsStore.actions.add("чужой", "чужая", { items: [] });

    const host = mount((preset) => <span>{line(preset)}</span>);

    expect(host.textContent).toContain("моя");
    expect(host.textContent).not.toContain("чужая");
  });

  it("новая запись своего вида доезжает в уже отрисованный список", () => {
    const host = mount((preset) => <span>{line(preset)}</span>);

    presetsStore.actions.add("свой", "поздняя", { items: [] });

    expect(host.textContent).toContain("поздняя");
    expect(host.textContent).not.toContain("Своих записей пока нет");
  });

  it("содержимое приезжает наружу уже приведённым стражем", () => {
    presetsStore.actions.add("свой", "моя", { items: ["раз", "два"] });

    const host = mount((_preset, content) => <span>{content().items.join("+")}</span>);

    expect(host.textContent).toContain("раз+два");
  });

  it("битое содержимое своей записи названо вслух, а не показано пустым", () => {
    presetsStore.actions.add("свой", "моя", { что: "то совсем другое" });

    const host = mount((_preset, content) => <span>{content().items.length}</span>);

    expect(host.textContent).toContain("Запись не наша");
  });

  it("правка черновиком доезжает в стор — потребитель про стор не знает", () => {
    const id = presetsStore.actions.add("свой", "моя", { items: ["раз"] });

    const host = mount((_preset, content, edit) => (
      <button type="button" onClick={() => edit((draft) => draft.items.push("два"))}>
        {content().items.join("+")}
      </button>
    ));
    host.querySelector("button")?.click();

    expect(asContent(presetsStore.selectors.presetBy(id)?.content)?.items).toEqual([
      "раз",
      "два",
    ]);
    expect(host.textContent).toContain("раз+два");
  });

  it("правка обновляет узел, а не пересобирает его", () => {
    const id = presetsStore.actions.add("свой", "была", { items: [] });
    presetsStore.actions.add("свой", "соседняя", { items: [] });

    const host = mount((preset) => <button type="button">{line(preset)}</button>);
    const node = host.querySelector("button");

    presetsStore.actions.rename(id, "стала");

    expect(host.querySelector("button")).toBe(node);
    expect(node?.textContent).toBe("стала");
  });
});
