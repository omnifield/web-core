import { createEffect, createSignal } from "@web-core/solid";
import { useNavigate, useRouteParamSelection } from "@web-core/router";
import type { TreeItemData } from "@web-core/ui";
import type { CatalogGroup } from "../ui/trees";

/** Каталог на входе: чем назван, чем наполнен и в какой параметр маршрута ложится выбранный
 *  пункт. Ровно та структура, которой описывает себя модель каталогов приложения. */
export interface CatalogSource {
  readonly value: string;
  readonly label: string;
  readonly items: () => readonly TreeItemData[];
  readonly param: string;
}

/** Каталоги на вкладках, подключённые к адресу: активная вкладка читается из маршрута,
 *  переключение уводит в ветку каталога без выбранного пункта, выбор пункта кладёт его в параметр
 *  ветки. Ветку каждому каталогу называет вызывающий (`routes` по имени каталога) — сам каталог
 *  не знает, на какой он странице; каталог без названного маршрута не показывается. */
export function useRouterCatalogTabs(
  catalogs: readonly CatalogSource[],
  routes: Readonly<Record<string, string>>,
) {
  const navigate = useNavigate();
  const branches = catalogs.flatMap((catalog) => {
    const to = routes[catalog.value];

    return to === undefined
      ? []
      : [
          {
            catalog,
            to,
            selection: useRouteParamSelection(catalog.param, to),
          },
        ];
  });

  // Вкладка идёт за адресом, но переживает ветку без выбранного пункта: имени в адресе ещё нет,
  // а каталог человек уже переключил.
  const named = () =>
    branches.find(({ selection }) => selection.value !== undefined)?.catalog
      .value;
  const [tab, setTab] = createSignal(named() ?? branches[0]?.catalog.value ?? "");

  createEffect(() => {
    const fromRoute = named();
    if (fromRoute !== undefined) setTab(fromRoute);
  });

  const groups: readonly CatalogGroup[] = branches.map(
    ({ catalog, selection }) => ({
      value: catalog.value,
      label: catalog.label,
      adapter: catalog.items,
      get activeValue() {
        return selection.value;
      },
      onSelect: selection.select,
    }),
  );

  return {
    tab,
    groups,
    openTab(value: string) {
      setTab(value);

      const branch = branches.find(({ catalog }) => catalog.value === value);
      if (branch === undefined) return;

      void navigate({ to: branch.to, params: {} });
    },
  };
}
