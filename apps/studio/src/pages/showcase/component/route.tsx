import { createFileRoute, notFound } from "@tanstack/solid-router";
import { Loader, selectComponent } from "#/entities/component";
import { ComponentPage } from "./index";

// Не `loader`: при `defaultPreload: "intent"` тот срабатывает на наведение, и витрина
// переключалась бы до клика. `onEnter` — первый заход, `onStay` — смена параметра на том же
// маршруте; оба зовутся только когда переход действительно случился.
export const Route = createFileRoute("/_workspace/showcase/{-$component}/")({
  loader: ({ params }) => {
    if (params.component === undefined) throw notFound();
  },
  onEnter: ({ params }) => selectComponent(params.component),
  onStay: ({ params }) => selectComponent(params.component),
  pendingComponent: Loader,
  notFoundComponent: () => null,
  component: () => <ComponentPage />,
});
