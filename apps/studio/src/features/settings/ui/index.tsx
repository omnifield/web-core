import { For } from "solid-js";
import { Flow } from "@web-core/ui";
import { useInfo } from "#/entities/component";
import { useSettings } from "#/entities/settings";
import { Setting } from "./setting";

/**
 * Панель настроек компонента: по строке на каждую настройку, объявленную его паспортом.
 *
 * Список ничего не знает про конкретные имена — что показать и каким контролом, решает паспорт.
 * Компонент, не объявивший ни одной настройки, оставляет панель пустой: пусто здесь — честный
 * ответ «нечего настраивать», а не потерянный экран.
 */
export function ComponentSettings() {
  const component = useInfo();
  const { settings, choose } = useSettings(
    component.name,
    () => component.passport()?.settings ?? {},
    () => component.editorInfo()?.settings,
  );

  return (
    <Flow data-variant="column">
      <For each={settings()}>
        {(facts) => <Setting facts={facts} onChoose={choose} />}
      </For>
    </Flow>
  );
}
