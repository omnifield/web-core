import { Show } from "@web-core/solid";
import { layoutGroup } from "@web-core/skin";
import { Flow, Typography } from "@web-core/ui";
import type { SettingFacts, SettingValue } from "#/entities/settings";
import { Choice } from "./choice";
import { Flag } from "./flag";

/** Настройка, которую отменила зависимость, остаётся на месте приглушённой: исчезни она совсем —
 *  человек искал бы её заново после каждого переключения соседней. */
const muted = { opacity: "0.5" };

export function Setting(props: {
  facts: SettingFacts;
  onChoose: (name: string, value: SettingValue) => void;
}) {
  const options = () => {
    const values = props.facts.setting.values;
    return values.kind === "choice" ? values.options : undefined;
  };

  return (
    <Flow data-variant="column" style={props.facts.applies ? undefined : muted}>
      <Flow style={layoutGroup({ justify: "space-between", align: "center" })}>
        <Typography>{props.facts.name}</Typography>
        <Show
          when={options()}
          fallback={
            <Flag
              checked={props.facts.value === true}
              disabled={!props.facts.applies}
              onChange={(checked) => props.onChoose(props.facts.name, checked)}
            />
          }
        >
          {(options) => (
            <Choice
              options={options()}
              means={props.facts.means?.options}
              value={String(props.facts.value)}
              disabled={!props.facts.applies}
              onChange={(value) => props.onChoose(props.facts.name, value)}
            />
          )}
        </Show>
      </Flow>
      <Show when={props.facts.means?.means}>
        {(means) => <Typography>{means()}</Typography>}
      </Show>
    </Flow>
  );
}
