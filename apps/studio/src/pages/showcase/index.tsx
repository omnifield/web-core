import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { ComponentProvider, tree } from "#/entities/component";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { FeedPanel } from "#/widgets/feed";
import { PreviewControls } from "#/widgets/preview";
import { RailPanel } from "#/widgets/rail";

export function ShowcasePage() {
  const selection = useRouterCatalogSelection("/showcase/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <ComponentProvider name={selection.activeValue}>
        <WorkspaceMain style={{ padding: 0 }}>
          <Outlet />
        </WorkspaceMain>
        <WorkspaceRightbar style={{ width: railVar("rail-lg"), padding: 0 }}>
          <RailPanel>
            <PreviewControls />
            <FeedPanel />
          </RailPanel>
        </WorkspaceRightbar>
      </ComponentProvider>
    </Workspace>
  );
}
