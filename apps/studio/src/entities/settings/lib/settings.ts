import type { PassportSettingEditorInfo } from "@web-core/skin/editor";
import { type PassportSetting, settingApplies } from "@web-core/skin/model";
import type { SettingValue } from "../model/store";

export type DeclaredSettings = Readonly<Record<string, PassportSetting>>;
export type SettingsMeans = Readonly<
  Record<string, PassportSettingEditorInfo>
> | undefined;

/**
 * Одна настройка компонента, собранная из обеих половин паспорта: машинной (какие значения, какое
 * умолчание, от чего зависит) и человеческой (`means` — что это значит и что значит каждый вариант).
 */
export interface SettingFacts {
  readonly name: string;
  readonly setting: PassportSetting;
  readonly means: PassportSettingEditorInfo | undefined;
  /** Выбранное человеком, иначе умолчание паспорта. */
  readonly value: SettingValue;
  /** Настройка сейчас имеет смысл: считает паспорт (`settingApplies`), а не витрина. */
  readonly applies: boolean;
}

/** Выбранное поверх умолчаний — набор, по которому паспорт считает применимость. */
export function effectiveValues(
  declared: DeclaredSettings,
  chosen: Readonly<Record<string, SettingValue>>,
): Readonly<Record<string, SettingValue>> {
  const values: Record<string, SettingValue> = {};
  for (const [name, setting] of Object.entries(declared)) {
    values[name] = setting.byDefault;
  }
  return { ...values, ...chosen };
}

/** Порядок — объявленный паспортом: он сгруппирован по смыслу, а алфавит развёл бы соседние. */
export function settingsOf(
  declared: DeclaredSettings,
  means: SettingsMeans,
  chosen: Readonly<Record<string, SettingValue>>,
): readonly SettingFacts[] {
  const values = effectiveValues(declared, chosen);

  return Object.entries(declared).map(([name, setting]) => ({
    name,
    setting,
    means: means?.[name],
    value: values[name] ?? setting.byDefault,
    applies: settingApplies(declared, name, values),
  }));
}

/**
 * То, что уезжает в показ корневыми пропами: настройка, отменённая зависимостью, не ставится
 * вовсе — иначе показ спорил бы с тем, что видно в панели.
 */
export function rootPropsOf(
  settings: readonly SettingFacts[],
): Readonly<Record<string, SettingValue>> {
  return Object.fromEntries(
    settings
      .filter((setting) => setting.applies)
      .map((setting) => [setting.name, setting.value]),
  );
}
