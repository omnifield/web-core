// Контекст на приложение вокруг `createSkinConnection`. Разбор — FAQ.md.
import {
  createContext,
  createEffect,
  createMemo,
  createResource,
  onMount,
  untrack,
  useContext,
  type Accessor,
  type JSX,
  type ParentProps,
  type Resource,
} from "@web-core/solid";

import { createSkinConnection, type SkinConnection } from "./connection.js";
import type { ComponentPassport } from "../engine/passport/form/index.js";
import type { SkinSource, SkinSwitchOptions, SkinWorn } from "../wear/switch.js";

/** `SkinConnection` плюс общий на приложение список имён источника. */
export interface SkinContextValue extends SkinConnection {
  names: Resource<readonly string[]>;
}

const SkinContext = createContext<SkinContextValue>();

export interface SkinProviderProps extends ParentProps {
  readonly source: SkinSource;
  readonly options?: SkinSwitchOptions;
  /** Зовётся один раз на монтировании с промисом восстановления наряда — для кода ВНЕ дерева
   *  Solid. Отказ гасится в `null`; наружу всегда уходит разрешённый промис. */
  readonly onReady?: (ready: Promise<SkinWorn | null>) => void;
}

/** Заводит `SkinConnection` на всё поддерево и сам восстанавливает запомненный выбор при
 *  монтировании. Источник и опции берутся один раз, как и у `createSkinConnection`. */
export function SkinProvider(props: SkinProviderProps): JSX.Element {
  const source = untrack(() => props.source);
  const skin = createSkinConnection(source, untrack(() => props.options) ?? {});
  const [names] = createResource(() => source.names());

  onMount(() => {
    const ready = skin.restore().catch((cause: unknown) => {
      console.debug("скин не восстановлен", cause);
      return null;
    });
    props.onReady?.(ready);
  });

  return (
    <SkinContext.Provider value={{ ...skin, names }}>{props.children}</SkinContext.Provider>
  );
}

/** Значение ближайшего `SkinProvider`. Вне него — отказ, не тихий `undefined`. */
export function useSkin(): SkinContextValue {
  const value = useContext(SkinContext);
  if (value === undefined) {
    throw new Error("[web-core-skin] useSkin(): вне <SkinProvider>.");
  }
  return value;
}

/**
 * Читает `data` последнего `ensureComponentSkin` компонента с этим именем — без второго запроса за
 * тем же. `T` — на совести вызывающего: контракт этого слоя `unknown`. Причины `undefined` контракт
 * не различает (см. {@link SkinConnection.componentData}). Разбор — FAQ.md.
 */
export function useComponentSkinData<T = unknown>(component: string): Accessor<T | undefined> {
  const value = useSkin();
  const data = createMemo(() => value.componentData().get(component) as T | undefined);
  return data;
}

/**
 * То же, но вторая половина того же ответа — про наряд целиком. Своей сети не заводит: требует,
 * чтобы ХОТЯ БЫ ОДИН компонент дерева уже позвал `useComponentSkin`. Разбор — FAQ.md.
 */
export function useOutfitData<T = unknown>(): Accessor<T | undefined> {
  const value = useSkin();
  const data = createMemo(() => value.outfitData() as T | undefined);
  return data;
}

/**
 * Компонент кита сам просит свой CSS — по значению `variant`/каждой `setting` c атрибутной меткой,
 * реактивно. Без `SkinProvider` в дереве — тихий no-op. `props` принимается как `object`, а не
 * `Record<string, unknown>` — разбор в FAQ.md (`component-skin-on-demand`).
 */
export function useComponentSkin(passport: ComponentPassport, props: object): void {
  const value = useContext(SkinContext);
  if (value === undefined) return;

  const record = props as Readonly<Record<string, unknown>>;
  const variantMark = passport.variantAxis.mark;
  const variantAttr = variantMark.kind === "attribute" ? variantMark.name : undefined;

  createEffect(() => {
    // `value.worn()` — трекнутая зависимость, не только значение: перезапускает эффект и когда
    // наряд появляется (после асинхронного restore()), и когда меняется. Разбор — FAQ.md.
    const outfitName = value.worn()?.name;
    if (outfitName === undefined) return;

    const attrValue = variantAttr === undefined ? undefined : (record[variantAttr] as string | undefined);
    value
      .ensureComponentSkin(passport.component, { kind: "variant", value: attrValue })
      .catch((cause: unknown) => console.debug(`скин компонента «${passport.component}» не допечатан`, cause));
  });

  for (const [name, setting] of Object.entries(passport.settings)) {
    if (setting.mark?.kind !== "attribute") continue;

    createEffect(() => {
      const outfitName = value.worn()?.name;
      if (outfitName === undefined) return;

      // Пропс называется по имени НАСТРОЙКИ, не по имени атрибута; не названный пропс замещается
      // `byDefault`. Разбор — FAQ.md.
      const raw = record[name] as string | boolean | undefined;
      const effective = raw ?? setting.byDefault;
      const attrValue = typeof effective === "boolean" ? String(effective) : effective;

      value
        .ensureComponentSkin(passport.component, { kind: "setting", name, value: attrValue })
        .catch((cause: unknown) => console.debug(`скин компонента «${passport.component}» не допечатан`, cause));
    });
  }
}
