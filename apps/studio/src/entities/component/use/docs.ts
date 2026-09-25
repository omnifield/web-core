import type { Accessor } from "@web-core/solid";
import { docsOf, NO_DOCS } from "../api";
import { componentStoreOf } from "../model";
import type { Delivery } from "./info";

/**
 * Документы компонента — своим хуком, а не полем в фактах: их читает тот, кто открыл доку, и
 * текст не должен ехать за каждым, кто спросил про компонент.
 *
 * Имя названо явно — отвечаем про названный компонент; не названо — про активный.
 */
export function useDocs(
  name?: string | Accessor<string>,
): Delivery<Awaited<ReturnType<typeof docsOf>>> {
  const named = typeof name === "function" ? name : () => name;
  const cell =
    name === undefined ? componentStoreOf.active() : componentStoreOf(named);

  const target = () => cell.selectors.name();
  // Ячейка-заглушка несёт пустое имя: запрашивать по нему нечего.
  const known = () => target() !== "";

  const docs = docsOf.use(target, () => ({ enabled: known() }));
  const waiting = () => known() && docs.isPending;

  return {
    data: () => (waiting() ? NO_DOCS : (docs.data ?? NO_DOCS)),
    isPending: waiting,
    error: () => docs.error,
  };
}
