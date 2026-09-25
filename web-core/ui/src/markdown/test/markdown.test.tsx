import { RenderTree } from "@web-core/assembly/render";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it } from "vitest";

import { kitComponentRenderer } from "../../component-registry.jsx";
import type { Data } from "../entity/io";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

/** Настоящий путь потребителя: `instanceOf(component, rootProps, assembly, data)` и `RenderTree`. */
function mount(text: string): HTMLElement {
  const { registry, instanceOf } = kitComponentRenderer();
  const data: Data = { text };
  const host = document.createElement("div");
  document.body.append(host);

  dispose = render(
    () => <RenderTree registry={registry} tree={instanceOf("markdown", {}, "basic", data)} data={data} />,
    host,
  );

  return host;
}

function part(host: HTMLElement, name: string): Element | null {
  return host.querySelector(`[data-scope="markdown"][data-part="${name}"]`);
}

describe("документ растит части сам — дерева схемы под них нет", () => {
  it("каждая часть анатомии получает свой адрес из текста", () => {
    const host = mount(
      [
        "# Заголовок",
        "",
        "Абзац со `кодом` внутри и [ссылкой](/docs).",
        "",
        "- первый",
        "- второй",
        "",
        "1. раз",
        "",
        "> цитата",
        "",
        "| имя | вид |",
        "| --- | --- |",
        "| a | b |",
        "",
        "```ts",
        "const x = 1;",
        "```",
      ].join("\n"),
    );

    expect(part(host, "root")).not.toBeNull();
    expect(part(host, "heading")?.tagName).toBe("H1");
    expect(part(host, "paragraph")?.textContent).toContain("Абзац");
    expect(part(host, "list")?.tagName).toBe("UL");
    expect(part(host, "quote")?.textContent).toContain("цитата");
    expect(part(host, "code")).not.toBeNull();
    expect(part(host, "link")?.getAttribute("href")).toBe("/docs");
    expect(host.querySelector('[data-part="table"]')?.tagName).toBe("TABLE");
  });

  it("уровень заголовка приезжает меткой, а не только тегом", () => {
    const host = mount("# раз\n\n### три\n");
    const headings = [...host.querySelectorAll('[data-part="heading"]')];

    expect(headings.map((node) => node.tagName)).toEqual(["H1", "H3"]);
    expect(headings.map((node) => node.getAttribute("data-level"))).toEqual(["1", "3"]);
  });

  it("нумерованный список отличается от маркированного и тегом, и меткой", () => {
    const host = mount("1. раз\n2. два\n");
    const list = part(host, "list");

    expect(list?.tagName).toBe("OL");
    expect(list?.getAttribute("data-ordered")).toBe("true");
  });

  it("код внутри строки помечен, код блоком — нет", () => {
    const host = mount("Строка с `inline` внутри.\n\n```\nблок\n```\n");
    const codes = [...host.querySelectorAll('[data-part="code"]')];

    expect(codes).toHaveLength(2);
    expect(codes[0]?.getAttribute("data-inline")).toBe("true");
    expect(codes[1]?.hasAttribute("data-inline")).toBe(false);
  });
});

describe("кит показывает ЧУЖОЙ текст — и не отдаёт ему свою разметку", () => {
  // Проверено на самом вендоре (`remark-rehype` зовётся с `allowDangerousHtml`, а отрисовка
  // знает только узлы `element` и `text`): сырая разметка не доходит до DOM ничем.
  it("сырая разметка из источника не превращается в узлы", () => {
    const host = mount('Текст <img src="x" onerror="alert(1)"> дальше.\n\n<script>alert(1)</script>\n');

    expect(host.querySelector("img")).toBeNull();
    expect(host.querySelector("script")).toBeNull();
    expect(host.innerHTML).not.toContain("onerror");
  });

  // Разборщик по умолчанию не правит адрес ссылки ничем (`transformLinkUri: null`) и ставит
  // всем ссылкам `target="_self"` — проверено на его же дистрибутиве, здесь закреплено фактом.
  it("адрес ссылки доезжает из документа как есть", () => {
    const host = mount("[док](../docs/README.md) и [чужое](https://example.test/a?b=1)\n");
    const links = [...host.querySelectorAll('[data-part="link"]')];

    expect(links.map((node) => node.getAttribute("href"))).toEqual([
      "../docs/README.md",
      "https://example.test/a?b=1",
    ]);
    expect(links[0]?.getAttribute("target")).toBe("_self");
  });

  it("служебные пропы разборщика в разметку не едут", () => {
    const host = mount("# Заголовок\n");
    const heading = part(host, "heading")!;

    expect(heading.hasAttribute("key")).toBe(false);
    expect(heading.hasAttribute("node")).toBe(false);
    expect(heading.hasAttribute("level")).toBe(false);
  });

  // Разборщик рисует свою обёртку сам, и адреса на ней нет — разбор в `FAQ.md` зоны. Части
  // документа лежат внутри неё, поэтому вертикальный ритм несут они, а не корень.
  it("между корнем и частями стоит неадресованный узел разборщика", () => {
    const host = mount("# Заголовок\n");
    const own = part(host, "root")!.firstElementChild!;

    expect(own.tagName).toBe("DIV");
    expect(own.hasAttribute("data-part")).toBe(false);
    expect(own.querySelector('[data-part="heading"]')).not.toBeNull();
  });
});
