import { createRootRoute, Outlet } from "@web-core/router";

import { NotFound } from "../pages/not-found";

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
});
