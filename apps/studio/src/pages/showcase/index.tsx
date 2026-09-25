import { createEffect, Show } from "@web-core/solid";
import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { moduleIoOf, moduleTemplateOf } from "#/entities/module";
import { UI_CATALOGS } from "#/features/catalogs";
import { Docs } from "#/features/preview";
import { ComponentSettings } from "#/features/settings";
import { CatalogTrees, useRouterCatalogTabs } from "#/widgets/catalogs";
import { FeedPanel } from "#/widgets/feed";
import { PreviewControls } from "#/widgets/preview";
import { RailPanel, RailSections } from "#/widgets/rail";

const COMPONENTS = "components";
const MODULES = "modules";

export function ShowcasePage() {
  const catalog = useRouterCatalogTabs(UI_CATALOGS, {
    components: "/showcase/component/{-$component}",
    modules: "/showcase/module/{-$module}",
  });

  const selectedModule = () =>
    catalog.groups.find((group) => group.value === MODULES)?.activeValue;

  // Временно в консоль: панель входа модуля ещё не заведена.
  createEffect(() => {
    const name = selectedModule();
    const template = name === undefined ? undefined : moduleTemplateOf(name);
    if (template === undefined) return;

    console.log(`вход модуля «${template.value}»`, moduleIoOf(template));
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
                {
                  value: "docs",
                  label: "Документы",
                  children: <Docs />,
                },
              ]}
            />
          </RailPanel>
        </Show>
      </WorkspaceRightbar>
    </Workspace>
  );
}
