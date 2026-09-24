import { createMemo, Show } from "@web-core/solid";
import { spaceVar } from "@web-core/skin";
import { Surface, Typography } from "@web-core/ui";
import { MODULE_DATA, moduleTemplateOf } from "#/entities/module";
import { Renderer } from "#/shared/ui/renderer";

// Раскладку корня модуля называет страница: наряд даёт сетке плитку автозаполнением, а показу
// модуля нужны ровно две ячейки в ширину.
const TWO_COLUMNS = {
  display: "grid",
  "grid-template-columns": "repeat(2, minmax(0, 1fr))",
  gap: spaceVar("space-2"),
  "align-items": "start",
} as const;

export function ModulePage(props: { name: string | undefined }) {
  const template = createMemo(() =>
    props.name === undefined ? undefined : moduleTemplateOf(props.name),
  );

  return (
    <Surface
      data-variant="filled"
      style={{ "block-size": "100%", "overflow-y": "auto" }}
    >
      <Show
        when={template()}
        fallback={<Typography>Модуль не выбран</Typography>}
      >
        {(found) => (
          <Surface>
            <Renderer
              composition={found().composition}
              data={MODULE_DATA}
              rootProps={{ style: TWO_COLUMNS }}
            />
          </Surface>
        )}
      </Show>
    </Surface>
  );
}
