import type { Accessor } from "solid-js";
import { contentRecordOf } from "../api";
import type { Delivery } from "./info";

/**
 * Тело одной записи данных по её имени.
 *
 * Отдельно от списка: список приезжает заголовками, а тело — только у выбранной записи и только
 * когда её выбрали. Имени нет — запроса нет вовсе.
 */
export function useContentRecord(
  name: Accessor<string | undefined>,
): Delivery<Awaited<ReturnType<typeof contentRecordOf>>> {
  const chosen = () => name() ?? "";
  const known = () => chosen() !== "";

  const record = contentRecordOf.use(chosen, () => ({ enabled: known() }));
  const waiting = () => known() && record.isPending;

  return {
    data: () => (waiting() ? undefined : record.data),
    isPending: waiting,
    error: () => record.error,
  };
}
