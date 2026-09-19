import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  kit as navigationMenuKit,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../components";
import { passport as navigationMenuPassport } from "../entity/passport";
import { assemblies } from "../playground/assemblies";
import { editorInfo as navigationMenuEditorInfo } from "../playground";

import { kit as iconKit } from "../../icon/components/index.js";
import { passport as iconPassport } from "../../icon/entity/passport.js";
import { editorInfo as iconEditorInfo } from "../../icon/playground/index.js";

function readable<Part extends string, Data = unknown>(
  passport: ComponentPassport<Part>,
  editorInfo: PassportEditorInfo<Part, string, Data>,
): ReadableComponent["passport"] {
  return {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    selfAssembly: passport.selfAssembly as any,
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    "navigation-menu": {
      passport: readable(navigationMenuPassport, navigationMenuEditorInfo),
      parts: navigationMenuKit.parts,
    },
    icon: { passport: readable(iconPassport, iconEditorInfo), parts: iconKit.parts },
  },
  admits,
});

const data = {
  items: [
    { value: "products", label: "Продукты" },
    { value: "resources", label: "Ресурсы" },
  ],
};

function mount(name: string) {
  const assembly = assemblies.find((candidate) => candidate.name === name)!;
  const tree = baseAssemblyOf(navigationMenuPassport, assembly as PassportAssembly, "navigation-menu", data);

  const host = document.createElement("div");
  document.body.append(host);

  return { host, dispose: render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host) };
}

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('navigation-menu "basic" — sections from data, one panel open at a time', () => {
  it("shows every section's label, every panel closed to start with", () => {
    const mounted = mount("basic");
    dispose = mounted.dispose;

    const triggers = [...mounted.host.querySelectorAll('[data-scope="navigation-menu"][data-part="trigger"]')];
    expect(triggers.map((trigger) => trigger.textContent)).toEqual(["Продукты", "Ресурсы"]);

    const panels = [...mounted.host.querySelectorAll('[data-scope="navigation-menu"][data-part="content"]')];
    expect(panels.every((panel) => panel.hasAttribute("hidden"))).toBe(true);
  });

  it("opens the clicked section and shows exactly its own panel — an empty slot, no links of its own", async () => {
    const mounted = mount("basic");
    dispose = mounted.dispose;

    const [products] = [...mounted.host.querySelectorAll<HTMLButtonElement>(
      '[data-scope="navigation-menu"][data-part="trigger"]',
    )];
    products!.click();

    await vi.waitFor(() => {
      expect(products!.getAttribute("data-state")).toBe("open");
    });

    const panels = [...mounted.host.querySelectorAll('[data-scope="navigation-menu"][data-part="content"]')];
    const visible = panels.filter((panel) => !panel.hasAttribute("hidden"));
    expect(visible).toHaveLength(1);

    expect(mounted.host.querySelectorAll('[data-scope="navigation-menu"][data-part="link"]')).toHaveLength(0);
  });

  it("keeps the same chevron in the trigger open or closed — nothing appears to widen it", async () => {
    const mounted = mount("basic");
    dispose = mounted.dispose;

    const trigger = mounted.host.querySelector<HTMLButtonElement>(
      '[data-scope="navigation-menu"][data-part="trigger"]',
    )!;

    await vi.waitFor(() => {
      expect(trigger.querySelector('[data-scope="icon"]')).not.toBeNull();
    });

    trigger.click();
    await vi.waitFor(() => {
      expect(trigger.getAttribute("data-state")).toBe("open");
    });

    expect(trigger.querySelectorAll('[data-scope="icon"]')).toHaveLength(1);
    expect(trigger.querySelector('[data-scope="navigation-menu"][data-part="item-indicator"]')).toBeNull();
  });

  it("closes the open section on Escape", async () => {
    const mounted = mount("basic");
    dispose = mounted.dispose;

    const [products] = [...mounted.host.querySelectorAll<HTMLButtonElement>(
      '[data-scope="navigation-menu"][data-part="trigger"]',
    )];
    products!.click();

    await vi.waitFor(() => {
      expect(products!.getAttribute("data-state")).toBe("open");
    });

    products!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    await vi.waitFor(() => {
      expect(products!.getAttribute("data-state")).toBe("closed");
    });
  });
});

describe("navigation-menu — the kit's own value contract, hand-composed", () => {
  it("opens from the outside and reports each change back as a plain string", async () => {
    const seen: string[] = [];
    const [open, setOpen] = createSignal("");

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <NavigationMenu
          value={open()}
          onValueChange={(value) => {
            seen.push(value);
            setOpen(value);
          }}
        >
          <NavigationMenuList>
            <NavigationMenuItem value="products">
              <NavigationMenuTrigger>Продукты</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#analytics">Аналитика</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      ),
      host,
    );

    const trigger = host.querySelector<HTMLButtonElement>('[data-scope="navigation-menu"][data-part="trigger"]')!;

    setOpen("products");
    await vi.waitFor(() => {
      expect(trigger.getAttribute("data-state")).toBe("open");
    });

    trigger.click();
    await vi.waitFor(() => {
      expect(trigger.getAttribute("data-state")).toBe("closed");
    });

    expect(seen).toEqual([""]);
  });
});

describe('navigation-menu "viewport" — the shared panel, the arrow and the sliding indicator', () => {
  it("draws every part the assembly names", () => {
    const mounted = mount("viewport");
    dispose = mounted.dispose;

    for (const part of ["list", "item", "trigger", "indicator", "arrow", "viewport-positioner", "viewport"]) {
      expect(
        mounted.host.querySelector(`[data-scope="navigation-menu"][data-part="${part}"]`),
        `часть «${part}» не нарисована`,
      ).not.toBeNull();
    }
  });

  it("moves the open section's panel inside the shared viewport", async () => {
    const mounted = mount("viewport");
    dispose = mounted.dispose;

    const trigger = mounted.host.querySelector<HTMLButtonElement>(
      '[data-scope="navigation-menu"][data-part="trigger"]',
    )!;
    trigger.click();

    await vi.waitFor(() => {
      expect(trigger.getAttribute("data-state")).toBe("open");
    });

    const viewport = mounted.host.querySelector('[data-scope="navigation-menu"][data-part="viewport"]')!;
    const panel = mounted.host.querySelector('[data-scope="navigation-menu"][data-part="content"]')!;

    expect(viewport.contains(panel)).toBe(true);
    expect(panel.hasAttribute("hidden")).toBe(false);
  });
});
