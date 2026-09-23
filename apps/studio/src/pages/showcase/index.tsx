import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import type { TreeItemData } from "@web-core/ui";
import { componentsTree } from "#/entities/component";
import { ComponentSettings } from "#/features/settings";
import { CatalogTrees, useRouterCatalogSelection } from "#/widgets/catalogs";
import { FeedPanel } from "#/widgets/feed";
import { PreviewControls } from "#/widgets/preview";
import { RailPanel, RailSections } from "#/widgets/rail";

// Заглушка до появления сущности модулей: дерево той же формы, что у кита, чтобы вкладка была
// видна и кликалась. Выбор модуля никуда не ведёт — маршрута под них пока нет.
const MODULES: readonly TreeItemData[] = [
  {
    value: "Формы",
    label: "Формы",
    children: [
      { value: "login-form", label: "login-form" },
      { value: "profile-form", label: "profile-form" },
    ],
  },
  {
    value: "Панели",
    label: "Панели",
    children: [{ value: "orders-board", label: "orders-board" }],
  },
];

export function ShowcasePage() {
  const selection = useRouterCatalogSelection("/showcase/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md"), padding: 0 }}>
        <CatalogTrees
          groups={[
            {
              value: "components",
              label: "Компоненты",
              adapter: componentsTree,
              activeValue: selection.activeValue,
              onSelect: selection.onSelect,
            },
            {
              value: "modules",
              label: "Модули",
              adapter: () => MODULES,
              onSelect: () => {},
            },
          ]}
        />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg"), padding: 0 }}>
        <RailPanel>
          <RailSections
            multiple
            items={[
              {
                value: "preview",
                label: "Показ",
                children: <PreviewControls />,
              },
              {
                value: "settings",
                label: "Настройки",
                children: <ComponentSettings />,
              },
              {
                value: "feed",
                label: "Данные",
                open: true,
                children: <FeedPanel />,
              },
            ]}
          />
        </RailPanel>
      </WorkspaceRightbar>
    </Workspace>
  );
}
