import { ObjectView } from "#/shared/ui/object-view";

/** Вид ячейки: показать данные как они есть — чем накормлено, чем собрано, чем одето. */
export function Data(props: { data: unknown; empty?: string }) {
  return <ObjectView data={props.data} empty={props.empty} />;
}
