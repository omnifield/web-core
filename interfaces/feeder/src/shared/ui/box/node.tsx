import { Button, Flow, Icon, Typography } from "@web-core/ui";
import {
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  Surface,
} from "@web-core/ui";
import { Show, type JSX } from "solid-js";

export function Node(props: {
  value: string;
  label: string;
  onAddChild?: () => void;
  onRemove?: () => void;
  children: JSX.Element;
}) {
  return (
    <AccordionItem value={props.value}>
      <AccordionControl>
        <Typography>{props.label}</Typography>
        <Flow>
          <Show when={props.onAddChild}>
            {(onAddChild) => (
              <Button
                data-variant="tertiary"
                aria-label="Добавить"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddChild()();
                }}
              >
                <Icon name="plus" />
              </Button>
            )}
          </Show>
          <Show when={props.onRemove}>
            {(onRemove) => (
              <Button
                data-variant="error-quiet"
                aria-label="Убрать"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove()();
                }}
              >
                <Icon name="trash" />
              </Button>
            )}
          </Show>
          <AccordionControlIndicator>▾</AccordionControlIndicator>
        </Flow>
      </AccordionControl>
      <AccordionContent>
        <Surface>{props.children}</Surface>
      </AccordionContent>
    </AccordionItem>
  );
}
