import { Button, Flow, FlowItem, Icon, Typography } from "@web-core/ui";
import {
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  Surface,
} from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Show, type JSX } from "@web-core/solid";

const ACTION = {
  ...layoutSelf({ grow: false, shrink: false }),
  padding: "0 var(--space-1)",
  "min-inline-size": "auto",
  "min-block-size": "auto",
  "line-height": "1",
};

const LABEL = {
  ...layoutSelf({ grow: true, shrink: true }),
  "min-width": "0",
  overflow: "hidden",
};

// Обрезка своим стилем, пока форма typography наряда не несёт настройку `truncated` — FAQ.md.
const TEXT = {
  display: "block",
  overflow: "hidden",
  "white-space": "nowrap",
  "text-overflow": "ellipsis",
};

export function Node(props: {
  value: string;
  label: string;
  onConfig?: () => void;
  onAddChild?: () => void;
  onRemove?: () => void;
  children: JSX.Element;
}) {
  return (
    <AccordionItem value={props.value}>
      <AccordionControl>
        <Flow
          style={{
            ...layoutSelf({ grow: true, shrink: true }),
            ...layoutGroup({ align: "center", gap: "space-1", wrap: false }),
            width: "100%",
            "min-width": "0",
          }}
        >
          <FlowItem style={LABEL}>
            <Typography title={props.label} truncated style={TEXT}>
              {props.label}
            </Typography>
          </FlowItem>
          <Show when={props.onConfig}>
            {(onConfig) => (
              <Button
                data-variant="tertiary"
                style={ACTION}
                aria-label="Настроить"
                onClick={(event) => {
                  event.stopPropagation();
                  onConfig()();
                }}
              >
                <Icon name="pencil" />
              </Button>
            )}
          </Show>
          <Show when={props.onAddChild}>
            {(onAddChild) => (
              <Button
                data-variant="tertiary"
                style={ACTION}
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
                style={ACTION}
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
          <AccordionControlIndicator
            style={layoutSelf({ grow: false, shrink: false })}
          >
            ▾
          </AccordionControlIndicator>
        </Flow>
      </AccordionControl>
      <AccordionContent>
        <Surface>{props.children}</Surface>
      </AccordionContent>
    </AccordionItem>
  );
}
