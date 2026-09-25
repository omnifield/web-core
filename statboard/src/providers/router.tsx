import {
  createRouter,
  defaultRouterOptions,
  RouterProvider,
} from "@web-core/router";

import { routeTree } from "../routeTree.gen";

const router = createRouter({ ...defaultRouterOptions, routeTree });

declare module "@web-core/router" {
  interface Register {
    router: typeof router;
  }
}

export function Router() {
  return <RouterProvider router={router} />;
}
