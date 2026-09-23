import { createFileRoute, notFound } from "@tanstack/solid-router";
import { Typography } from "@web-core/ui";
import { componentDescriptorOf, selectComponent } from "#/entities/component";
import { KitchenPage } from "./index";

export const Route = createFileRoute(
  "/_workspace/lab/{-$component}/{-$feature}",
)({
  loader: ({ params }) => {
    if (params.component === undefined || params.feature === undefined) {
      throw notFound();
    }
    if (componentDescriptorOf(params.component).passport === undefined) {
      throw notFound();
    }
  },
  // Та же причина, что у витрины: в загрузчике выбор сработал бы на наведение.
  onEnter: ({ params }) => selectComponent(params.component),
  onStay: ({ params }) => selectComponent(params.component),
  notFoundComponent: () => (
    <Typography>Выберите компонент слева и фичу справа</Typography>
  ),
  component: KitchenPage,
});
