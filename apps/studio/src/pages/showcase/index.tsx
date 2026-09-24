import { Show } from "@web-core/solid";
import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { UI_CATALOGS } from "#/features/catalogs";
import { ComponentSettings } from "#/features/settings";
import { CatalogTrees, useRouterCatalogTabs } from "#/widgets/catalogs";
import { FeedPanel } from "#/widgets/feed";
import { PreviewControls } from "#/widgets/preview";
import { RailPanel, RailSections } from "#/widgets/rail";

const COMPONENTS = "components";

export function ShowcasePage() {
  const catalog = useRouterCatalogTabs(UI_CATALOGS, {
    components: "/showcase/component/{-$component}",
    modules: "/showcase/module/{-$module}",
  });

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md"), padding: 0 }}>
        <CatalogTrees
          value={catalog.tab()}
          onValueChange={(details) => catalog.openTab(details.value)}
          groups={catalog.groups}
        />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg"), padding: 0 }}>
        <Show when={catalog.tab() === COMPONENTS}>
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
        </Show>
      </WorkspaceRightbar>
    </Workspace>
  );
}
