import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io";
import { passport } from "../../entity/passport";

type NavigationMenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const viewport: PassportAssembly<NavigationMenuPart, string, Data> = {
  name: "viewport",
  means: "те же разделы, но слот каждого переезжает в одну общую панель с клином на раскрытый раздел",
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
          { node: "indicator", children: [{ node: "arrow", children: [] }] },
        ],
      },
      {
        node: "viewportPositioner",
        props: { align: "start" },
        children: [{ node: "viewport", children: [] }],
      },
    ],
  },
};
