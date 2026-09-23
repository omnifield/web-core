import { createFileRoute, notFound } from "@tanstack/solid-router";
import { componentStoreOf, Loader } from "#/entities/component";
import { ComponentPage } from "./index";

/** Сперва собрать ячейку, потом активировать: читатели берут активную и имени не знают. */
function select(name: string | undefined): void {
  if (name === undefined) return;

  componentStoreOf.create(name);
  componentStoreOf.activate(name);
}

// Не `loader`: при `defaultPreload: "intent"` тот срабатывает на наведение, и витрина
// переключалась бы до клика. `onEnter` — первый заход, `onStay` — смена параметра на том же
// маршруте; оба зовутся только когда переход действительно случился.
export const Route = createFileRoute("/_workspace/showcase/{-$component}/")({
  loader: ({ params }) => {
    if (params.component === undefined) throw notFound();
  },
  onEnter: ({ params }) => select(params.component),
  onStay: ({ params }) => select(params.component),
  pendingComponent: Loader,
  notFoundComponent: () => null,
  component: () => <ComponentPage />,
});
