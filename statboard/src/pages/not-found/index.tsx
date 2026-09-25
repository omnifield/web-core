import { Link, useRouter } from "@web-core/router";
import { For } from "@web-core/solid";
import { Flow, Surface, Typography } from "@web-core/ui";

declare module "@web-core/router" {
  interface StaticDataRouteOption {
    title?: string;
  }
}

export function NotFound() {
  const router = useRouter();

  const destinations = () =>
    Object.entries(router.routesByPath)
      .map(([path, route]) => ({
        path,
        title: route.options.staticData?.title,
      }))
      .filter((destination) => destination.title !== undefined);

  return (
    <Surface data-variant="filled">
      <Flow data-variant="column">
        <Typography as="h1" data-variant="display">
          Такого адреса нет
        </Typography>
        <Typography data-variant="body">
          Страница по этому адресу не заведена. Ниже — то, что в демке есть.
        </Typography>

        <Flow data-variant="row">
          <For each={destinations()}>
            {(destination) => (
              <Typography as={Link} to={destination.path} data-variant="body">
                {destination.title}
              </Typography>
            )}
          </For>
        </Flow>
      </Flow>
    </Surface>
  );
}
