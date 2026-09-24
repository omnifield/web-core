// Реактивная обвязка над `SkinSwitch` для Solid. Разбор — FAQ.md.

import { createSignal, onCleanup, type Accessor } from "@web-core/solid";

import {
  makeSkinSwitch,
  type ComponentSkinAxis,
  type EnsuredSkinData,
  type SkinMode,
  type SkinSource,
  type SkinSwitchOptions,
  type SkinWearOptions,
  type SkinWorn,
} from "../wear/switch.js";

/** То же самое, что `SkinSwitch`, но `worn` — сигнал, а не функция по запросу. */
export interface SkinConnection {
  worn: Accessor<SkinWorn | null>;
  wear(name: string, options?: SkinWearOptions): Promise<SkinWorn | null>;
  takeOff(options?: SkinWearOptions): void;
  restore(): Promise<SkinWorn | null>;
  /** Переключает половину БЕЗ повторного похода к источнику — обе половины уже в CSS, приехавшем
   *  на `wear()`. Ничего не надето — не действует. */
  setMode(mode: SkinMode): void;
  /** Прямой доступ к `SkinSwitch.ensureComponentSkin` — `useComponentSkin` зовёт его сама, руками
   *  дёргать незачем, но наружу не скрыт. Побочный эффект каждого вызова — запись в
   *  {@link componentData} по имени компонента и в {@link outfitData}, см. там же. */
  ensureComponentSkin(component: string, axis: ComponentSkinAxis): Promise<EnsuredSkinData>;
  /** `data` последнего `ensureComponentSkin` каждого компонента, по имени. Чистится при смене
   *  ИМЕНИ наряда. Разбор — FAQ.md (`component-skin-data-passthrough`). */
  componentData: Accessor<ReadonlyMap<string, unknown>>;
  /** То же, но про наряд целиком — ОДНО значение на соединение, не карта. Разбор — FAQ.md
   *  (`outfit-data-passthrough`). */
  outfitData: Accessor<unknown>;
}

/**
 * Заводит `SkinSwitch` и оборачивает его сигналом. Зовите внутри компонента или `createRoot()` —
 * уборка вешается на `onCleanup()` самим примитивом.
 */
export function createSkinConnection(
  source: SkinSource,
  options: SkinSwitchOptions = {},
): SkinConnection {
  const skin = makeSkinSwitch(source, options);
  const [worn, setWorn] = createSignal(skin.worn());
  const [componentData, setComponentData] = createSignal<ReadonlyMap<string, unknown>>(new Map());
  const [outfitData, setOutfitData] = createSignal<unknown>(undefined);

  onCleanup(() => skin.dispose());

  /** Единственная точка обновления `worn`-сигнала — чистку видят все пути одинаково (FAQ.md). */
  function applyWorn(result: SkinWorn | null): SkinWorn | null {
    if (result?.name !== worn()?.name) {
      setComponentData(new Map());
      setOutfitData(undefined);
    }
    setWorn(result);
    return result;
  }

  async function wear(name: string, wearOptions?: SkinWearOptions): Promise<SkinWorn | null> {
    const result = await skin.wear(name, wearOptions);
    return applyWorn(result);
  }

  function takeOff(wearOptions?: SkinWearOptions): void {
    skin.takeOff(wearOptions);
    applyWorn(skin.worn());
  }

  async function restore(): Promise<SkinWorn | null> {
    const result = await skin.restore();
    return applyWorn(result);
  }

  function setMode(mode: SkinMode): void {
    skin.setMode(mode);
    applyWorn(skin.worn());
  }

  /** Гейт по имени наряда — СВОЙ, не унаследованный от нижнего слоя (разбор — FAQ.md). */
  async function ensureComponentSkin(component: string, axis: ComponentSkinAxis): Promise<EnsuredSkinData> {
    const startedFor = worn()?.name;
    const ensured = await skin.ensureComponentSkin(component, axis);
    if (worn()?.name !== startedFor) return {};

    setComponentData((prev) => {
      const next = new Map(prev);
      next.set(component, ensured.data);
      return next;
    });
    setOutfitData(ensured.outfit);
    return ensured;
  }

  return { worn, wear, takeOff, restore, setMode, ensureComponentSkin, componentData, outfitData };
}
