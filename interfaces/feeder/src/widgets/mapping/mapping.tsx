import type { FieldRef, FieldRule, PathType } from "@web-core/io";
import { Field, FieldLabel, FieldSelect, Flow, Surface, Typography } from "@web-core/ui";
import { createMemo, For, Show } from "solid-js";

import { describeVariant, recordPathsOf, rowSetsOf } from "../../entities/mapping";

/** Что настроил человек: где в ответе записи и как поля одной записи ложатся на вход потребителя.
 *  Ровно та пара, из которой состоит адаптер привязки. */
export interface MappingChange {
  readonly root: FieldRef;
  readonly rules: readonly FieldRule[];
}

const NOT_MAPPED = "";
const WHOLE_RESPONSE = "";

function ruleFrom(rules: readonly FieldRule[], target: FieldRef): FieldRef {
  return rules.find((rule) => rule.target === target)?.from ?? NOT_MAPPED;
}

function upsert(
  rules: readonly FieldRule[],
  target: FieldRef,
  from: FieldRef,
): readonly FieldRule[] {
  const rest = rules.filter((rule) => rule.target !== target);
  return from === NOT_MAPPED ? rest : [...rest, { target, from }];
}

function label(field: PathType): string {
  return `${field.path === "" ? "(всё значение)" : field.path} · ${field.type}`;
}

/**
 * Сведение «ответ ручки → вход потребителя»: слева поля ОДНОЙ записи ответа, справа поля
 * потребителя, на каждое поле потребителя — выбор пути слева. Собственной механики нет, всё
 * описание форм — `@web-core/io` через `entities/mapping`.
 *
 * Полностью контролируемый, как и `Tree`: `root`/`rules` приходят снаружи, наружу течёт
 * `onChange` на каждый пик (не по кнопке) — хранение и сохранение решает тот, кто монтирует.
 *
 * `target` — проп, а не «схема компонента по имени»: сведение так работает и для потребителя не
 * из кита, а «где взять io-схему по имени компонента» остаётся решением приложения.
 */
export function Mapping(props: {
  /** Ответ ручки: сэмпл сырых данных или зод-схема. */
  source: unknown;
  /** Вход потребителя: зод-схема или сэмпл. */
  target: unknown;
  root?: FieldRef;
  rules?: readonly FieldRule[];
  onChange: (change: MappingChange) => void;
}) {
  const root = (): FieldRef => props.root ?? WHOLE_RESPONSE;
  const rules = (): readonly FieldRule[] => props.rules ?? [];

  const rowSets = createMemo(() => rowSetsOf(props.source));
  const sourceFields = createMemo(() => recordPathsOf(props.source, root()));
  const targetFields = createMemo(() => describeVariant(props.target));

  function pickRoot(next: FieldRef) {
    // Сменился набор записей — сменились и пути внутри записи. Правила, которые больше некуда
    // применить, уносим сразу: молча оставленное правило с несуществующим `from` даёт пустое
    // поле на витрине и выглядит там как беда данных, хотя это беда настройки.
    const paths = new Set(recordPathsOf(props.source, next).map((field) => field.path));
    props.onChange({ root: next, rules: rules().filter((rule) => rule.from !== undefined && paths.has(rule.from)) });
  }

  return (
    <Surface>
      <Show when={rowSets().length > 0}>
        <Field>
          <FieldLabel>Где в ответе записи</FieldLabel>
          <FieldSelect
            value={root()}
            onChange={(event) => pickRoot(event.currentTarget.value)}
          >
            <option value={WHOLE_RESPONSE}>весь ответ</option>
            <For each={rowSets()}>{(path) => <option value={path}>{path}</option>}</For>
          </FieldSelect>
        </Field>
      </Show>

      <Show
        when={targetFields().length > 0}
        fallback={<Typography>У потребителя не видно полей — нечего сводить</Typography>}
      >
        <For each={targetFields()}>
          {(field) => (
            <Flow>
              <Field>
                <FieldLabel>{label(field)}</FieldLabel>
                <FieldSelect
                  value={ruleFrom(rules(), field.path)}
                  onChange={(event) =>
                    props.onChange({
                      root: root(),
                      rules: upsert(rules(), field.path, event.currentTarget.value),
                    })
                  }
                >
                  <option value={NOT_MAPPED}>— не сведено —</option>
                  <For each={sourceFields()}>
                    {(source) => <option value={source.path}>{label(source)}</option>}
                  </For>
                </FieldSelect>
              </Field>
            </Flow>
          )}
        </For>
      </Show>
    </Surface>
  );
}
