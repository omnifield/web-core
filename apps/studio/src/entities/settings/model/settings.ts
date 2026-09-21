import { type Accessor, createMemo } from "solid-js";
import { useComponent } from "#/entities/component";
import { rootPropsOf, type SettingFacts, settingsOf } from "../lib";
import { type SettingValue, settingsStoreOf } from "./store";

/**
 * Чем сейчас настроен текущий компонент — и как его перенастроить.
 *
 * Та же доска, что у кормления (`entities/feed`), только про другую ось: панель пишет, показ
 * читает, друг о друге они не знают. Своего провайдера нет — стор берётся по имени компонента,
 * которое уже назвал `ComponentProvider`.
 */
export function useSettings(): {
  settings: Accessor<readonly SettingFacts[]>;
  choose: (name: string, value: SettingValue) => void;
  values: Accessor<Readonly<Record<string, SettingValue>>>;
} {
  const component = useComponent();
  const store = settingsStoreOf(component.name);
  const chosen = store.use((state) => state.chosen);

  const settings = createMemo(() =>
    settingsOf(
      component.passport()?.settings ?? {},
      component.editorInfo()?.settings,
      chosen(),
    ),
  );

  const values = createMemo(() => rootPropsOf(settings()));

  return {
    settings,
    choose: (name, value) => store.actions.choose(name, value),
    values,
  };
}
