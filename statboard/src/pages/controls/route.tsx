import { createFileRoute } from "@tanstack/solid-router";

import { Controls } from "./index";

export const Route = createFileRoute("/controls")({
  component: Controls,
  staticData: { title: "Настройки" },
});
