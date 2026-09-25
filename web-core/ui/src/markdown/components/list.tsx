import type { JSX } from "@web-core/solid";
import { Dynamic } from "@web-core/solid/web";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";
import { anatomyParts } from "../entity/anatomy";
import { dropRendererProps } from "./renderer-props";

// Без `ref`: тег у части выбирается по данным документа, и одной ссылки на элемент для двух
// возможных тегов не существует — часть рисует разборщик, ссылка на узел ей не нужна.
export type MarkdownListProps = Omit<JSX.HTMLAttributes<HTMLElement>, "ref"> & {
  /** Нумерованный список; задаёт и тег, и метку состояния. */
  ordered?: boolean;
};

export function MarkdownList(props: MarkdownListProps) {
  traceLife("ui.markdown-list");

  return (
    <Dynamic
      component={props.ordered ? "ol" : "ul"}
      {...dropAddress(dropRendererProps(props))}
      data-ordered={props.ordered ? "true" : undefined}
      {...anatomyParts.list.attrs}
    />
  );
}
