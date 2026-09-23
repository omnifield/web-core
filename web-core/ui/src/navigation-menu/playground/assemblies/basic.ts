import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io";
import { passport } from "../../entity/passport";

type NavigationMenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<NavigationMenuPart, string, Data> = {
  name: "basic",
  means: "полоса разделов из данных, у каждого раздела своя панель — слот под содержимое потребителя",
  tree: {
    node: "root",
    children: [
      {
        node: "list",
        children: [
          {
            node: "item",
            repeat: { path: "/items" },
            bind: { value: "value" },
            children: [
              {
                node: "trigger",
                children: [
                  { genus: "text", value: { path: "label" } },
                  { node: "icon", props: { name: "chevron-down" } },
                ],
              },
              { node: "content", children: [] },
            ],
          },
          { node: "indicator" },
        ],
      },
    ],
  },
};
