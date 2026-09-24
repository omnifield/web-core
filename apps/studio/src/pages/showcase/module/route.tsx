import { createFileRoute } from "@tanstack/solid-router";
import { ModulePage } from "./index";

export const Route = createFileRoute("/_workspace/showcase/module/{-$module}")({
  component: () => {
    const params = Route.useParams();

    return <ModulePage name={params().module} />;
  },
});
