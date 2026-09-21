import type { PathType } from "@web-core/io";
import { createMemo, createResource, createSignal, Show } from "@web-core/solid";
import { Typography } from "@web-core/ui";

import {
  adapterFor,
  ADAPTER_KIND,
  ADAPTER_SHAPE,
  link,
  rememberUser,
  unlink,
  type Adapter,
} from "../../../entities/adapter";
import {
  failureOf,
  loadPresets,
  presetNamed,
  PresetSaving,
  PRESET_NAME,
  presetsStore,
  pushPreset,
} from "../../../entities/preset";
import { savedAdapters } from "../lib";
import { Mastering } from "./mastering";

const EMPTY: Adapter = { root: "", rules: [], providers: {}, consumers: {} };

function labelOf(provider: readonly string[], consumer: readonly string[]): string {
  return `${consumer.at(-1) ?? "потребитель"} ← ${provider.at(-1) ?? "поставщик"}`;
}

export function AdapterMastering(props: {
  provider: readonly string[];
  consumer: readonly string[];
  output: readonly PathType[];
  input: readonly PathType[];
  label?: string;
}) {
  const [unsent, setUnsent] = createSignal<string>();
  const [typed, setTyped] = createSignal<string>();

  const [pulled] = createResource(async () => {
    const stored = await loadPresets(ADAPTER_SHAPE);
    presetsStore.actions.adopt(stored);
    return stored.length;
  });

  const records = createMemo(() => savedAdapters());

  const current = createMemo(() => {
    const adapter = adapterFor(
      records().map((one) => one.content),
      props.provider,
      props.consumer,
    );

    return records().find((one) => one.content === adapter);
  });

  async function send(id: string): Promise<void> {
    try {
      await pushPreset(id);
      setUnsent(undefined);
    } catch (error) {
      setUnsent(failureOf(error).message);
    }
  }

  function edit(recipe: (draft: Parameters<typeof link>[0]) => void): void {
    const found = current();
    if (found !== undefined) {
      presetsStore.actions.edit<Adapter>(found.preset.id, recipe);
      void send(found.preset.id);
      return;
    }

    const provider = props.provider;
    const consumer = props.consumer;

    const id = presetsStore.actions.add(
      ADAPTER_KIND,
      props.label ?? labelOf(provider, consumer),
      EMPTY,
    );

    presetsStore.actions.edit<Adapter>(id, (draft) => {
      rememberUser(draft, "providers", provider);
      rememberUser(draft, "consumers", consumer);
      recipe(draft);
    });

    void send(id);
  }

  const name = () => typed() ?? current()?.preset.name ?? "";

  const taken = () => {
    const found = presetNamed(ADAPTER_KIND, name());
    return found !== undefined && found.id !== current()?.preset.id;
  };

  const note = () => {
    if (current() === undefined) return "Свяжите хотя бы одно поле — сохранять пока нечего";
    if (name() === "") return undefined;
    if (!PRESET_NAME.safeParse(name()).success)
      return PRESET_NAME.safeParse(name()).error?.issues[0]?.message;
    if (taken()) return "Такое имя в этом виде уже занято";
    return undefined;
  };

  function save(): void {
    const found = current();
    if (found === undefined) return;

    presetsStore.actions.rename(found.preset.id, name());
    void send(found.preset.id);
  }

  return (
    <>
      <PresetSaving
        name={name()}
        onName={setTyped}
        onSave={save}
        disabled={current() === undefined || note() !== undefined || name() === ""}
        note={note()}
      />

      <Show when={pulled.loading}>
        <Typography>Читаем адаптеры из службы…</Typography>
      </Show>

      <Show when={pulled.error}>
        {(error) => (
          <Typography>Службу прочитать не вышло: {failureOf(error()).message}</Typography>
        )}
      </Show>

      <Show when={unsent()}>
        {(message) => <Typography>Связи в службу не уехали: {message()}</Typography>}
      </Show>

      <Mastering
        output={props.output}
        input={props.input}
        rules={current()?.content.rules ?? []}
        onLink={(made) =>
          edit((draft) => {
            link(draft, made.target, made.from);
          })
        }
        onUnlink={(target) =>
          edit((draft) => {
            unlink(draft, target);
          })
        }
      />
    </>
  );
}
