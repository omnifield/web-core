import { createFileRoute, notFound } from "@tanstack/solid-router";
import { ModulePage } from "./index";

export const Route = createFileRoute("/_workspace/showcase/module/{-$name}")({
  loader: ({ params }) => {
    if (params.name === undefined) throw notFound();
    return { name: params.name };
  },
  notFoundComponent: () => null,
  component: () => <ModulePage name={Route.useLoaderData()().name} />,
});
