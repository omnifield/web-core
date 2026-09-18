import type { Consumer } from "@web-core/feeder";
import { kitComponentProvider } from "@web-core/ui/component-info";

/**
 * Потребители еды для экрана привязок — компоненты кита, у которых есть io-схема ВХОДА.
 *
 * Движок список потребителей не знает намеренно (`Consumer` приходит пропом): «какие компоненты
 * есть у приложения и где взять форму их входа» — знание продукта. У студии оно уже собрано в
 * реестре форм кита, поэтому здесь не перечень руками, а тот же реестр: компонент, у которого
 * появилась io-схема, попадает в список сам.
 *
 * В реестр кита пишутся только те, у кого есть `input` (`direction` — `input` или `io`), значит
 * отдельного фильтра «а входа-то нет» здесь не нужно: чистая отдача в реестр не попадает вовсе.
 */
export function kitConsumers(): readonly Consumer[] {
  return kitComponentProvider()
    .io.list()
    .map((entry) => ({ name: entry.meta.component, input: entry.schema }));
}
