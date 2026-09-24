import { Surface, Typography } from "@web-core/ui";
import { componentStoreOf } from "#/entities/component";

export function Passport() {
  const component = componentStoreOf.active();

  return (
    <Surface data-variant="filled">
      <Typography>{component.selectors.name()}</Typography>
    </Surface>
  );
}
