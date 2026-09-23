import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { tree } from "#/entities/component";
import { ComponentSettings } from "#/features/settings";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { FeedPanel } from "#/widgets/feed";
import { PreviewControls } from "#/widgets/preview";
import { RailPanel, RailSections } from "#/widgets/rail";

export function ShowcasePage() {
  const selection = useRouterCatalogSelection("/showcase/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
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
