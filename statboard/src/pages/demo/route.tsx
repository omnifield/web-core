import { createFileRoute } from "@tanstack/solid-router";

import { Demo } from "./index";

export const Route = createFileRoute("/")({
  component: Demo,
});
