import { For } from "@web-core/solid";
import {
  Surface,
  TabsContent,
  TabsList,
  type TabsProps,
  Tabs as TabsRoot,
  TabsTrigger,
  type TreeItemData,
} from "@web-core/ui";
import { CatalogTree } from "./tree";

/** Одно дерево каталога со своим ярлыком: что показывать и что делать с выбором. */
export interface CatalogGroup {
  readonly value: string;
  readonly label: string;
  readonly adapter: () => readonly TreeItemData[];
  readonly activeValue?: string;
  readonly onSelect: (value: string) => void;
}

// Каталог стоит в колонке заданной высоты, и её надо довести до самого дерева: корень берёт
// высоту места, лента вкладок остаётся своего роста, панель забирает остаток. `min-block-size: 0`
// обязателен на каждом шаге — иначе флекс не даёт сжать элемент ниже содержимого и прокрутке
// внутри нечего резать.
const fillPlace = { "block-size": "100%", "min-block-size": "0" };
const fillRest = {
  flex: "1",
  "min-block-size": "0",
  "overflow-y": "auto",
} as const;

/** Несколько каталогов рядом: вкладка на каждый, дерево внутри вкладки. */
export function CatalogTrees(props: {
  groups: readonly CatalogGroup[];
  value?: TabsProps["value"];
  defaultValue?: TabsProps["defaultValue"];
  onValueChange?: TabsProps["onValueChange"];
}) {
  return (
    <TabsRoot
      value={props.value}
      defaultValue={props.defaultValue ?? props.groups[0]?.value}
      onValueChange={props.onValueChange}
      style={fillPlace}
    >
      <TabsList>
        <For each={props.groups}>
          {(group) => (
            <TabsTrigger value={group.value}>{group.label}</TabsTrigger>
          )}
        </For>
      </TabsList>
      <For each={props.groups}>
        {(group) => (
          <TabsContent value={group.value} style={fillRest}>
            <Surface data-variant="filled">
              <CatalogTree
                adapter={group.adapter}
                activeValue={group.activeValue}
                onSelect={group.onSelect}
              />
            </Surface>
          </TabsContent>
        )}
      </For>
    </TabsRoot>
  );
}
