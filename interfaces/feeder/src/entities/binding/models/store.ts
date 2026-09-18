import type { ExtraPolicy, FieldRef, FieldRule } from "@web-core/io";
import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

import { bindingKey, type Binding, type BindingSource } from "./types.js";

export interface BindingsState {
  readonly bindings: readonly Binding[];
}

/**
 * Семья привязок по ИМЕНИ КОМПОНЕНТА, а не по ручке — ключ выбран стороной, которая читает:
 * на витрине компонент знает только себя («я `Table`, где моя еда»), про айди бэка и ручки он
 * не знает ничего.
 *
 * Ровно поэтому адаптер не может жить на ручке: одна ручка (`GET /users`) кормит и таблицу, и
 * листбокс, а правила сведения у них РАЗНЫЕ — на ручке их пришлось бы держать картой по
 * компонентам, то есть тем же самым, только вывернутым наизнанку и без изоляции.
 */
export const bindingStoreOf = createActionStoreFamily<
  BindingsState,
  {
    bind(source: BindingSource): void;
    unbind(id: string): void;
    setRules(id: string, rules: readonly FieldRule[]): void;
    setRoot(id: string, root: FieldRef): void;
    setExtra(id: string, extra: ExtraPolicy): void;
    /** Поднять сохранённые снаружи привязки (бэк, localStorage) — движок их не хранит между
     *  сессиями сам, но обязан уметь принять их обратно целиком. */
    hydrate(bindings: readonly Binding[]): void;
  },
  // Ключ семьи — имя компонента.
  string
>({ bindings: [] }, ({ setState }) => ({
  bind(source) {
    setState(
      mutate<BindingsState>((draft) => {
        const id = bindingKey(source);
        const at = draft.bindings.findIndex((binding) => bindingKey(binding.source) === id);
        // Повторная привязка той же ручки — это смена параметров вызова, а не вторая привязка;
        // уже сведённые поля при этом не теряем, ручка и её форма ответа те же.
        if (at === -1) draft.bindings.push(castDraft({ source, root: "", rules: [] }));
        else draft.bindings[at].source = castDraft(source);
      }),
    );
  },
  unbind(id) {
    setState(
      mutate<BindingsState>((draft) => {
        draft.bindings = draft.bindings.filter((binding) => bindingKey(binding.source) !== id);
      }),
    );
  },
  setRules(id, rules) {
    setState(
      mutate<BindingsState>((draft) => {
        const binding = draft.bindings.find((item) => bindingKey(item.source) === id);
        if (binding !== undefined) binding.rules = castDraft(rules);
      }),
    );
  },
  setRoot(id, root) {
    setState(
      mutate<BindingsState>((draft) => {
        const binding = draft.bindings.find((item) => bindingKey(item.source) === id);
        if (binding !== undefined) binding.root = root;
      }),
    );
  },
  setExtra(id, extra) {
    setState(
      mutate<BindingsState>((draft) => {
        const binding = draft.bindings.find((item) => bindingKey(item.source) === id);
        if (binding !== undefined) binding.extra = extra;
      }),
    );
  },
  hydrate(bindings) {
    setState(
      mutate<BindingsState>((draft) => {
        draft.bindings = castDraft(bindings);
      }),
    );
  },
}));

/** Привязка по айди — обычная функция над состоянием: параметризованные селекторы стора не
 *  проходят типизацию `@web-core/store` (та же причина, что у `endpointBy`). */
export function bindingBy(state: BindingsState, id: string): Binding | undefined {
  return state.bindings.find((binding) => bindingKey(binding.source) === id);
}
