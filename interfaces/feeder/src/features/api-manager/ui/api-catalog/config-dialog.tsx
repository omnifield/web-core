import { createEffect, createMemo, createSignal, Show } from "@web-core/solid";
import { layoutSelf } from "@web-core/skin";
import { Button, Dialog, DialogContent, Flow, FlowItem } from "@web-core/ui";
import type { z } from "@web-core/io";

import { Tree } from "../../../../entities/form";
import {
  applyEndpointConfig,
  applyGroupConfig,
  endpointConfigOf,
  ENDPOINT_CONFIG,
  groupConfigOf,
  GROUP_CONFIG,
  type ConfigTarget,
  type EndpointConfig,
  type GroupConfig,
  type SchemaDocument,
} from "../../../../entities/openapi";
import {
  presetConfigOf,
  presetsStore,
  PRESET_CONFIG,
  type Preset,
  type PresetConfig,
} from "../../../../entities/preset";

export interface ConfigSubject {
  readonly preset: Preset;
  readonly target: ConfigTarget;
}

function formOf(subject: ConfigSubject): {
  schema: z.ZodType;
  value: unknown;
} {
  const { preset, target } = subject;

  if (target.kind === "schema")
    return { schema: PRESET_CONFIG, value: presetConfigOf(preset) };

  if (target.kind === "group")
    return { schema: GROUP_CONFIG, value: groupConfigOf(target.item) };

  return { schema: ENDPOINT_CONFIG, value: endpointConfigOf(target.item) };
}

function write(subject: ConfigSubject, value: unknown): void {
  const { preset, target } = subject;

  if (target.kind === "schema") {
    presetsStore.actions.relabel(preset.id, (value as PresetConfig).label);
    return;
  }

  presetsStore.actions.edit<SchemaDocument>(preset.id, (draft) => {
    if (target.kind === "group")
      applyGroupConfig(draft, target.item.id, value as GroupConfig);
    else applyEndpointConfig(draft, target.item.id, value as EndpointConfig);
  });
}

export function ConfigDialog(props: {
  subject?: ConfigSubject;
  onClose: () => void;
  onWritten?: (presetId: string) => void;
}) {
  const form = createMemo(() =>
    props.subject === undefined ? undefined : formOf(props.subject),
  );

  const [edited, setEdited] = createSignal<unknown>();

  createEffect(() => {
    form();
    setEdited(undefined);
  });

  const value = () => edited() ?? form()?.value;

  const close = () => {
    setEdited(undefined);
    props.onClose();
  };

  const save = () => {
    const subject = props.subject;
    if (subject !== undefined) {
      write(subject, value());
      props.onWritten?.(subject.preset.id);
    }
    close();
  };

  return (
    <Dialog
      open={props.subject !== undefined}
      onOpenChange={(details) => {
        if (!details.open) close();
      }}
    >
      <DialogContent>
        <Show when={form()}>
          {(form) => (
            <Flow data-variant="column">
              <FlowItem style={layoutSelf({ align: "stretch" })}>
                <Tree
                  schema={form().schema}
                  value={value()}
                  onChange={(next) => setEdited(() => next)}
                />
              </FlowItem>

              <FlowItem>
                <Button onClick={save}>Сохранить</Button>
              </FlowItem>
            </Flow>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}
