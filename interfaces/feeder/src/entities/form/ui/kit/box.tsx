import { For, type JSX } from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  Flow,
  Icon,
  Surface,
  Typography,
} from "@web-core/ui";

import { Button } from "./button.js";

function Section(props: {
  value: string;
  label: string;
  action: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <AccordionItem value={props.value}>
      <AccordionControl>
        <Typography>{props.label}</Typography>
        <Flow>
          {props.action}
          <AccordionControlIndicator>▾</AccordionControlIndicator>
        </Flow>
      </AccordionControl>
      <AccordionContent>
        <Surface>{props.children}</Surface>
      </AccordionContent>
    </AccordionItem>
  );
}

export function Box(props: {
  label: string;
  onAdd: () => void;
  indices: readonly number[];
  itemLabel: (index: number) => string;
  onRemove: (index: number) => void;
  children: (index: number) => JSX.Element;
}) {
  return (
    <Accordion collapsible data-variant="cards">
      <Section
        value="list"
        label={props.label}
        action={
          <Button
            data-variant="tertiary"
            onClick={(event) => {
              event.stopPropagation();
              props.onAdd();
            }}
            aria-label="Добавить"
          >
            <Icon name="plus" />
          </Button>
        }
      >
        <Accordion collapsible multiple data-variant="cards">
          <For each={props.indices}>
            {(index) => (
              <Section
                value={String(index)}
                label={props.itemLabel(index)}
                action={
                  <Button
                    data-variant="error-quiet"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onRemove(index);
                    }}
                    aria-label="Убрать"
                  >
                    <Icon name="trash" />
                  </Button>
                }
              >
                {props.children(index)}
              </Section>
            )}
          </For>
        </Accordion>
      </Section>
    </Accordion>
  );
}
