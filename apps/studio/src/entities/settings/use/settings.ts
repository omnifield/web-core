import { type Accessor, createMemo } from "@web-core/solid";
import {
  type DeclaredSettings,
  rootPropsOf,
  type SettingFacts,
  type SettingsMeans,
  settingsOf,
} from "../lib";
import { type SettingValue, settingsStoreOf } from "../model";

/**
 * Чем сейчас настроен таргет — и как его перенастроить.
 *
 * Та же доска, что у кормления: панель пишет, показ читает, друг о друге они не знают. Ключ доски
 * и объявленные настройки называет вызывающий — у компонента они из паспорта, у сборки из
 * компонентов будет свой источник, и доска от этого не меняется.
 */
export function useSettings(
  key: string | Accessor<string>,
  declared: Accessor<DeclaredSettings>,
  means?: Accessor<SettingsMeans>,
): {
  settings: Accessor<readonly SettingFacts[]>;
  choose: (name: string, value: SettingValue) => void;
  values: Accessor<Readonly<Record<string, SettingValue>>>;
} {
  const store = settingsStoreOf(typeof key === "function" ? key : () => key);
  const chosen = store.use((state) => state.chosen);

  const settings = createMemo(() =>
    settingsOf(declared(), means?.(), chosen()),
  );

  const values = createMemo(() => rootPropsOf(settings()));

  return {
    settings,
    choose: (name, value) => store.actions.choose(name, value),
    values,
  };
}
