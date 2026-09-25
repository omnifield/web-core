import { createRootRoute, Outlet } from "@web-core/router";

export const Route = createRootRoute({
  component: () => <Outlet />,
});
