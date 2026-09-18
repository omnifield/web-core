import { BindingEditor } from "@web-core/feeder";
import { Field, FieldInput, FieldLabel, Surface, Typography } from "@web-core/ui";
import { createSignal, Show } from "solid-js";

import { kitConsumers } from "../lib";
import { EndpointForm } from "./endpoint-form";
import { SchemaSource } from "./schema-source";

/** Айди бэка по умолчанию — ключ семьи каталогов. Один и тот же ключ на любой странице даёт тот
 *  же каталог, так что заведённое здесь видно и тому, кто кормит компонент на витрине. */
const DEFAULT_API = "lab";

/**
 * Настройка API целиком, как её видит студия: чем наполнить каталог (схемой или руками) и что с
 * ручками делать дальше (привязать к компоненту и свести поля — это уже `BindingEditor`).
 *
 * Оба способа наполнения стоят рядом не для симметрии: каталог у них ОДИН (`apiCatalogOf(api)`),
 * и ручка, заведённая руками, дальше по пайплайну ничем не отличается от распознанной из схемы.
 * Проверять это удобнее всего, когда оба входа видно одновременно.
 *
 * Айди API — поле, а не константа: стор каталогов — семья по этому ключу, и «две апихи не видят
 * ручек друг друга» проверяется только сменой ключа. Пропом он не приходит: тот, кто монтирует
 * панель, ключ не выбирает — его называет человек прямо здесь, и переименование посреди работы
 * это ровно тот сценарий, который панель обязана пережить.
 */
export function FeederPanel() {
  const [api, setApi] = createSignal(DEFAULT_API);
  // Документ отдаём `BindingEditor` пропом, а не грузим сами: перезалив он забирает эффектом, и
  // это ровно тот путь, которым пакетом пользуется приложение.
  const [raw, setRaw] = createSignal<string>();

  const consumers = kitConsumers();

  return (
    <Surface>
      <Field>
        <FieldLabel>Айди API</FieldLabel>
        <FieldInput
          value={api()}
          onInput={(event) => setApi(event.currentTarget.value.trim())}
        />
      </Field>

      <Show when={api() !== ""} fallback={<Typography>Назовите айди API</Typography>}>
        <SchemaSource onLoad={setRaw} />
        <EndpointForm api={api()} />
        <BindingEditor api={api()} raw={raw()} consumers={consumers} />
      </Show>
    </Surface>
  );
}
