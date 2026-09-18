import { createFileRoute, notFound } from "@tanstack/solid-router";
import { Typography } from "@web-core/ui";
import { componentDescriptorOf } from "#/entities/component";
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
  notFoundComponent: () => (
    <Typography>Выберите компонент слева и фичу справа</Typography>
  ),
  component: KitchenPage,
});
