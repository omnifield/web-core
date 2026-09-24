import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { uiCatalog } from "#/features/catalogs";
import { ComponentSettings } from "#/features/settings";
import { CatalogTrees, useRouterCatalogSelection } from "#/widgets/catalogs";
import { FeedPanel } from "#/widgets/feed";
import { PreviewControls } from "#/widgets/preview";
import { RailPanel, RailSections } from "#/widgets/rail";

export function ShowcasePage() {
  const selection = useRouterCatalogSelection("/showcase/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md"), padding: 0 }}>
        <CatalogTrees
          groups={uiCatalog().map((catalog) => ({
            value: catalog.value,
            label: catalog.label,
            adapter: catalog.items,
            activeValue: selection.activeValue,
            onSelect: selection.onSelect,
          }))}
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
