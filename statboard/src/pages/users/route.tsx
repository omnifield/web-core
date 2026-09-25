import { createFileRoute } from "@tanstack/solid-router";

import { Users } from "./index";

export const Route = createFileRoute("/users")({
  component: Users,
  staticData: { title: "Команда" },
});
