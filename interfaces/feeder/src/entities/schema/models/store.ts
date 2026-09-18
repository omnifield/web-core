import { createActionStore } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

import type { Schema } from "./types";

export interface SchemasState {
  readonly schemas: readonly Schema[];
}

export const schemasStore = createActionStore<
  SchemasState,
  {
    add(name: string, raw: string): string;
    remove(id: string): void;
    rename(id: string, name: string): void;
    replace(id: string, raw: string): void;
    hydrate(schemas: readonly Schema[]): void;
  },
  { schemaBy(state: SchemasState, id: string): Schema | undefined }
>(
  { schemas: [] },
  ({ setState }) => ({
    add(name, raw) {
      const id = crypto.randomUUID();
      setState(
        mutate<SchemasState>((draft) => {
          draft.schemas.push(castDraft({ id, name, raw }));
        }),
      );
      return id;
    },
    remove(id) {
      setState(
        mutate<SchemasState>((draft) => {
          draft.schemas = draft.schemas.filter((schema) => schema.id !== id);
        }),
      );
    },
    rename(id, name) {
      setState(
        mutate<SchemasState>((draft) => {
          const schema = draft.schemas.find((item) => item.id === id);
          if (schema !== undefined) schema.name = name;
        }),
      );
    },
    replace(id, raw) {
      setState(
        mutate<SchemasState>((draft) => {
          const schema = draft.schemas.find((item) => item.id === id);
          if (schema !== undefined) schema.raw = raw;
        }),
      );
    },
    hydrate(schemas) {
      setState(
        mutate<SchemasState>((draft) => {
          draft.schemas = castDraft(schemas);
        }),
      );
    },
  }),
  () => ({
    schemaBy(state, id) {
      return state.schemas.find((schema) => schema.id === id);
    },
  }),
);
