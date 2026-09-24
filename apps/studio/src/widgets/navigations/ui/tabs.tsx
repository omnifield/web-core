import { createMemo, For, type JSX } from "@web-core/solid";
import {
  TabsContent,
  TabsList,
  type TabsProps,
  Tabs as TabsRoot,
  TabsTrigger,
} from "@web-core/ui";

/** Табы стоят в рейле, у которого высота определённая, — и эту высоту надо ДОВЕСТИ до содержимого,
 *  иначе она обрывается здесь. Корень берёт высоту места (форма `omnifield-tabs` уже делает его
 *  колонкой флекса), лента вкладок остаётся своего роста, а панель забирает остаток.
 *
 *  `min-block-size: 0` на каждом шаге не украшение: по умолчанию флекс-элемент не даёт сжать себя
 *  ниже собственного содержимого, высота внутри становится «сколько выросло», и прокрутка внутри
 *  панели не работает вообще — резать нечего. */
const fillPlace = { "block-size": "100%", "min-block-size": "0" };
const fillRest = { flex: "1", "min-block-size": "0" };

export function NavigationTabs(props: {
  content: Record<string, () => JSX.Element>;
  value?: TabsProps["value"];
  defaultValue?: TabsProps["defaultValue"];
  onValueChange?: TabsProps["onValueChange"];
}) {
  const content = createMemo(() => props.content);
  const keys = createMemo(() => Object.keys(content()));

  return (
    <TabsRoot
      value={props.value}
      defaultValue={props.defaultValue ?? keys()[0]}
      onValueChange={props.onValueChange}
      style={fillPlace}
    >
      <TabsList>
        <For each={keys()}>
          {(key) => <TabsTrigger value={key}>{key}</TabsTrigger>}
        </For>
      </TabsList>
      <For each={keys()}>
        {(key) => (
          <TabsContent value={key} style={fillRest}>
            {content()[key]!()}
          </TabsContent>
        )}
      </For>
    </TabsRoot>
  );
}
