import { Surface, Typography } from "@web-core/ui";
import { useComponent } from "#/entities/component";

export function Passport() {
  const { name } = useComponent();

  return (
    <Surface data-variant="filled">
      <Typography>{name}</Typography>
    </Surface>
  );
}
