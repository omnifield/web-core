import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Box } from "../../src/shared/ui";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

interface Row {
  readonly id: string;
  readonly title: string;
}

const rows: Row[] = [
  { id: "pet", title: "pet" },
  { id: "store", title: "store" },
];

function mount(ui: () => ReturnType<typeof Box<Row>>): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(ui, host);
  return host;
}

function buttons(host: HTMLElement, label: string): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>(`button[aria-label="${label}"]`)];
}

describe("Box", () => {
  it("без колбэков кнопок нет вообще — ни плюса, ни корзины", () => {
    const host = mount(() => (
      <Box items={rows} itemKey={(row) => row.id} itemLabel={(row) => row.title}>
        {(row) => <span>{row().id}</span>}
      </Box>
    ));

    expect(buttons(host, "Добавить")).toHaveLength(0);
    expect(buttons(host, "Убрать")).toHaveLength(0);
  });

  it("кнопка появляется от самого колбэка, иконку кладёт Box, а не потребитель", () => {
    const host = mount(() => (
      <Box
        items={rows}
        itemKey={(row) => row.id}
        itemLabel={(row) => row.title}
        onItemAddChild={vi.fn()}
      >
        {(row) => <span>{row().id}</span>}
      </Box>
    ));

    expect(buttons(host, "Добавить")).toHaveLength(rows.length);
    expect(buttons(host, "Убрать")).toHaveLength(0);
  });

  it("действие отдаёт ЭЛЕМЕНТ, а не его номер", () => {
    const onItemRemove = vi.fn();
    const host = mount(() => (
      <Box
        items={rows}
        itemKey={(row) => row.id}
        itemLabel={(row) => row.title}
        onItemRemove={onItemRemove}
      >
        {(row) => <span>{row().id}</span>}
      </Box>
    ));

    buttons(host, "Убрать")[1]?.click();

    expect(onItemRemove).toHaveBeenCalledWith(rows[1]);
  });

  it("без `label` верхней секции нет — вложенный бокс не плодит лишний заголовок", () => {
    const host = mount(() => (
      <Box items={rows} itemKey={(row) => row.id} itemLabel={(row) => row.title}>
        {(row) => <span>{row().id}</span>}
      </Box>
    ));

    expect(host.textContent).not.toContain("Петстор");
    expect(host.textContent).toContain("pet");
  });

  it("с `label` появляется своя секция со своими действиями", () => {
    const onAddChild = vi.fn();
    const onRemove = vi.fn();
    const host = mount(() => (
      <Box
        label="Петстор"
        onAddChild={onAddChild}
        onRemove={onRemove}
        items={rows}
        itemKey={(row) => row.id}
        itemLabel={(row) => row.title}
      >
        {(row) => <span>{row().id}</span>}
      </Box>
    ));

    expect(host.textContent).toContain("Петстор");

    buttons(host, "Добавить")[0]?.click();
    expect(onAddChild).toHaveBeenCalled();

    buttons(host, "Убрать")[0]?.click();
    expect(onRemove).toHaveBeenCalled();
  });
});
