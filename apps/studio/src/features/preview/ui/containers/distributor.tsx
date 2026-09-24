import { Match, Show, Switch } from "@web-core/solid";
import type { PassportAssembly } from "@web-core/skin/editor";
import type { VariantSummary } from "@web-core/skin/presets";
import { Typography } from "@web-core/ui";
import { Loader } from "#/entities/component";
import type { Cell } from "../../lib/cell";
import { groupByTags, noGroup } from "../../lib/group";
import { usePreview } from "../../use";
import { Grid } from "./grid";
import { Matrix } from "./matrix";

type PrimaryItem = VariantSummary | PassportAssembly;

export function Distributor() {
  const { store, component, primaryItems, secondaryItems } = usePreview();
  const layoutMode = store.use((state) => state.layoutMode);
  const filter = store.use((state) => state.filterMode);

  const indexed = () =>
    primaryItems().map((item: PrimaryItem, index: number) => ({ item, index }));

  // Теги есть только у вариантов — у сборок такого поля нет. Ветка `undefined` здесь уже не
  // «тихо ничего не сгруппировали»: стор не даёт `filterMode: "tags"` ужиться с осью сборок
  // (`filterAppliesTo`), так что на этой оси сюда не заходят.
  const entryGroups = () =>
    filter() === "tags"
      ? groupByTags(indexed(), (entry) =>
          "tags" in entry.item ? entry.item.tags : undefined,
        )
      : noGroup(indexed());

  const groups = () =>
    entryGroups().map((group) => ({
      label: group.label,
      items: group.items.map(
        (entry): Cell => ({
          primary: entry.index,
          group: group.label,
        }),
      ),
    }));

  // Пока списки едут, показывать нечего — но и молчать нельзя: раньше на этом месте был просто
  // пустой экран, неотличимый от «у компонента нет вариантов». Отказ службы пресетов тем более
  // называется словами, а не остаётся в консоли отклонённым промисом.
  return (
    <Show
      when={component.variants.error()}
      fallback={
        <Show when={!component.variants.isPending()} fallback={<Loader />}>
          <Switch>
            <Match when={layoutMode() === "grid"}>
              <Grid groups={groups()} secondaryItems={secondaryItems()} />
            </Match>
            <Match when={layoutMode() === "matrix"}>
              <Matrix groups={groups()} secondaryItems={secondaryItems()} />
            </Match>
          </Switch>
        </Show>
      }
    >
      {(error) => (
        <Typography>
          Не удалось загрузить компонент: {error().message}
        </Typography>
      )}
    </Show>
  );
}
