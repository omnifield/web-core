import { QueryClient, QueryClientProvider } from "@web-core/query";
import type { ParentProps } from "@web-core/solid";

const client = new QueryClient();

export function Query(props: ParentProps) {
  return (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );
}
