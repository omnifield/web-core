import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  TabsContent,
  TabsList,
  Tabs as TabsRoot,
  TabsTrigger,
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { tree } from "#/entities/component";
import { FeederPanel } from "#/features/feeder";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { Chat } from "#/widgets/chat";

export function LabPage() {
  const selection = useRouterCatalogSelection("/lab/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      {/* Чат и настройка API делят одну колонку вкладками, а не стоят друг под другом: в рейле
          на двоих места нет, а `unmountOnExit` здесь не стоит намеренно — переписка чата и
          заполненные поля настройки обязаны пережить переключение вкладки. */}
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        <TabsRoot defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat">Чат</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <Chat />
          </TabsContent>
          <TabsContent value="api">
            <FeederPanel />
          </TabsContent>
        </TabsRoot>
      </WorkspaceRightbar>
    </Workspace>
  );
}
