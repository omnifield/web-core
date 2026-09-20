import type { PathType } from "@web-core/io";
import { createMemo } from "@web-core/solid";

import {
  adapterFor,
  asAdapter,
  ADAPTER_KIND,
  link,
  rememberUser,
  unlink,
  type Adapter,
} from "../../../entities/adapter";
import { presetsStore, type Preset } from "../../../entities/preset";
import { Mastering } from "./mastering";

interface Record {
  readonly preset: Preset;
  readonly adapter: Adapter;
}

const EMPTY: Adapter = { root: "", rules: [], providers: {}, consumers: {} };

function nameOf(provider: readonly string[], consumer: readonly string[]): string {
  return `${consumer.at(-1) ?? "потребитель"} ← ${provider.at(-1) ?? "поставщик"}`;
}

export function AdapterMastering(props: {
  provider: readonly string[];
  consumer: readonly string[];
  output: readonly PathType[];
  input: readonly PathType[];
  name?: string;
}) {
  const records = createMemo<Record[]>(() =>
    presetsStore.selectors
      .presetsOf(ADAPTER_KIND)
      .map((preset) => ({ preset, adapter: asAdapter(preset.content) }))
      .filter((one): one is Record => one.adapter !== undefined),
  );

  const current = createMemo(() => {
    const adapter = adapterFor(
      records().map((one) => one.adapter),
      props.provider,
      props.consumer,
    );

    return records().find((one) => one.adapter === adapter);
  });

  function edit(recipe: (draft: Parameters<typeof link>[0]) => void): void {
    const found = current();
    if (found !== undefined) {
      presetsStore.actions.edit<Adapter>(found.preset.id, recipe);
      return;
    }

    const provider = props.provider;
    const consumer = props.consumer;

    const id = presetsStore.actions.add(
      ADAPTER_KIND,
      props.name ?? nameOf(provider, consumer),
      EMPTY,
    );

    presetsStore.actions.edit<Adapter>(id, (draft) => {
      rememberUser(draft, "providers", provider);
      rememberUser(draft, "consumers", consumer);
      recipe(draft);
    });
  }

  return (
    <Mastering
      output={props.output}
      input={props.input}
      rules={current()?.adapter.rules ?? []}
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
  );
}
