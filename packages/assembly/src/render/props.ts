// см. README.md / FAQ.md

import {
  isContent,
  isDataBinding,
  isElement,
  isEventBinding,
  resolveDataBinding,
  resolveEventBinding,
  type AssemblyNode,
  type DispatchedEvent,
} from "../engine/tree.js";

const DOM_EVENT_PROP: Readonly<Record<string, string>> = {
  click: "onClick",
  change: "onChange",
  input: "onInput",
  submit: "onSubmit",
};

/** `bind` узла (имя пропа → путь в данных) в готовые значения — путь без значения не кладётся
 * пропом вовсе (`undefined` — не «нет данных», а «пропа нет»), чтобы не перебивать дефолт кита. */
export function resolveBind(
  bind: Readonly<Record<string, string>> | undefined,
  data: unknown,
): Record<string, unknown> | undefined {
  return bind
    ? Object.fromEntries(
        Object.entries(bind)
          .map(([name, path]) => [name, resolveDataBinding(data, path)] as const)
          .filter(([, value]) => value !== undefined),
      )
    : undefined;
}

/** `on` узла в DOM-обработчики — только известные `DOM_EVENT_PROP`, остальные молча пропускаются.
 * Контекст резолвится ДО выхода наружу: слушатель `DispatchedEvent` получает готовый JSON, не
 * сырой DOM `Event` (FAQ.md). */
export function dispatchHandlersFor(
  current: AssemblyNode | undefined,
  data: unknown,
  dispatch: ((event: DispatchedEvent) => void) | undefined,
): Record<string, (domEvent: Event) => void> {
  if (!current || !isElement(current) || !current.on) return {};

  return Object.fromEntries(
    Object.entries(current.on).flatMap(([domEvent, action]) => {
      const propName = DOM_EVENT_PROP[domEvent];
      if (!propName) return [];

      return [
        [
          propName,
          (nativeEvent: Event) => {
            const context = Object.fromEntries(
              Object.entries(action.event.context ?? {})
                .map(([key, value]) => [
                  key,
                  isDataBinding(value)
                    ? resolveDataBinding(data, value.path)
                    : isEventBinding(value)
                      ? resolveEventBinding(nativeEvent, value.event)
                      : value,
                ] as const)
                .filter(([, value]) => value !== undefined),
            );

            dispatch?.({
              name: action.event.name,
              nodeId: current.id,
              address: current.type,
              timestamp: new Date().toISOString(),
              context,
            });
          },
        ],
      ];
    }),
  );
}

/** Пропы, с которыми узел реально рисуется — свои литералы, резолвленный `bind`, обработчики
 * `on`, и `rootProps` ПОСЛЕДНИМ (только у корня непусто — живое состояние показа перебивает
 * объявленное дерево, а не наоборот). Не-content узел без пропов/байндинга/событий — пустой
 * объект, законное рабочее состояние. */
export function ownPropsFor(
  current: AssemblyNode | undefined,
  data: unknown,
  dispatch: ((event: DispatchedEvent) => void) | undefined,
  rootProps: Readonly<Record<string, unknown>> | undefined,
): Record<string, unknown> {
  if (!current || !isElement(current)) return {};

  return {
    ...current.props,
    ...resolveBind(current.bind, data),
    ...dispatchHandlersFor(current, data, dispatch),
    ...rootProps,
  };
}

/** Данные для вложенного дерева — пропы+`bind` узла-ссылки, БЕЗ `on`/`rootProps` (те не данные
 * показа, а связь наружу/состояние показа этого конкретного узла, вложенному дереву они не
 * принадлежат). Одна и та же дверь у двух видов ссылки: своё поведение компонента (self-assembly)
 * и чужой модуль — данные подставленному дереву даёт узел-ссылка, форма у обоих одна. */
export function innerDataFor(
  current: AssemblyNode | undefined,
  data: unknown,
): Record<string, unknown> | undefined {
  if (!current || isContent(current)) return undefined;
  return { ...current.props, ...resolveBind(current.bind, data) };
}
