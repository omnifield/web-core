import { createMemo, For, type JSX } from "solid-js";
import { spaceVar } from "@web-core/skin";
import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  type AccordionProps,
  Surface,
} from "@web-core/ui";

/** Тот же шаг, что держит отступ самой поверхности рейла (`ui/panel.tsx`). */
const inset = { padding: spaceVar("space-1") };
const flush = { padding: "0" };

export type RailSection = {
  value: string;
  label: JSX.Element;
  children: JSX.Element;
  open?: boolean;
  padded?: boolean;
};

/**
 * Секции рейла: заголовок раскрывает своё содержимое.
 *
 * Виджет даёт раскладку и ничего не знает о том, что в секции положили, — данные принимает в
 * нейтральной форме, готовым `JSX.Element`. Управление раскрытием отдаётся наружу теми же
 * именами, что у корня аккордеона из кита: `value` берут, когда состоянием управляют снаружи,
 * `defaultValue` — когда нет.
 *
 * Начальное состояние можно сказать и на самой секции (`open`) — список называется в одном
 * месте вместе с содержимым. Явный `defaultValue` сильнее: он говорит про набор целиком.
 *
 * Содержимое ложится на плоскость с отступом; секция, которой отступ мешает, говорит
 * `padded: false`.
 */
export function RailSections(props: {
  items: readonly RailSection[];
  multiple?: AccordionProps["multiple"];
  collapsible?: AccordionProps["collapsible"];
  value?: AccordionProps["value"];
  defaultValue?: AccordionProps["defaultValue"];
  onValueChange?: AccordionProps["onValueChange"];
}) {
  const opened = createMemo(
    () =>
      props.defaultValue ??
      props.items.filter((section) => section.open).map(({ value }) => value),
  );

  return (
    <Accordion
      multiple={props.multiple}
      collapsible={props.collapsible}
      value={props.value}
      defaultValue={opened()}
      onValueChange={props.onValueChange}
    >
      <For each={props.items}>
        {(section) => (
          <AccordionItem value={section.value}>
            <AccordionControl>
              {section.label}
              <AccordionControlIndicator>▾</AccordionControlIndicator>
            </AccordionControl>
            <AccordionContent>
              <Surface style={section.padded === false ? flush : inset}>
                {section.children}
              </Surface>
            </AccordionContent>
          </AccordionItem>
        )}
      </For>
    </Accordion>
  );
}
