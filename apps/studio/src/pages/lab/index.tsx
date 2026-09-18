import { Outlet, useRouteParamSelection } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  TabsList,
  Tabs as TabsRoot,
  TabsTrigger,
  Typography,
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { For, Show } from "solid-js";
import { tree } from "#/entities/component";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { KITCHEN_FEATURES, kitchenFeatureBy } from "./model";

/**
 * Оба параметра кухни адресуются ОДНИМ маршрутом, и переходы делаются по нему же: выбор в дереве
 * меняет компонент, вкладка — фичу, а второй параметр каждый раз доезжает нетронутым (переход
 * собирается поверх текущих параметров). Иначе выбор компонента сбрасывал бы фичу, и наоборот.
 */
const KITCHEN_ROUTE = "/lab/{-$component}/{-$feature}";

/**
 * Каркас лаба: слева состав кита, справа фичи, посередине рабочая поверхность выбранной фичи
 * (дочерний маршрут, `Outlet`).
 *
 * Рейл фич живёт ЗДЕСЬ, а не в дочерней странице, потому что он часть каркаса: он не меняется
 * при переходе между фичами, он их и переключает. А вот ЧТО в нём монтируется, решает та же
 * запись реестра, что даёт содержимое main, — см. `KitchenFeature`.
 */
export function LabPage() {
  const selection = useRouterCatalogSelection(KITCHEN_ROUTE);
  const feature = useRouteParamSelection("feature", KITCHEN_ROUTE);

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        {/* Фича без компонента не адресуется: в урле компонент стоит ПЕРЕД фичей, и «фича без
            компонента» прочиталась бы как компонент с именем фичи. Поэтому рейл ждёт выбора. */}
        <Show
          when={selection.activeValue}
          fallback={<Typography>Выберите компонент слева</Typography>}
        >
          <TabsRoot
            value={feature.value ?? ""}
            onValueChange={(details) => feature.select(details.value)}
          >
            <TabsList>
              <For each={KITCHEN_FEATURES}>
                {(item) => <TabsTrigger value={item.id}>{item.title}</TabsTrigger>}
              </For>
            </TabsList>
          </TabsRoot>
          <Show
            when={kitchenFeatureBy(feature.value)}
            fallback={<Typography>Выберите фичу</Typography>}
          >
            {(active) => active().rightbar()}
          </Show>
        </Show>
      </WorkspaceRightbar>
    </Workspace>
  );
}
