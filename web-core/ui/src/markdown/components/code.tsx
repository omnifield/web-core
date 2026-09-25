import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";
import { anatomyParts } from "../entity/anatomy";
import { dropRendererProps } from "./renderer-props";

export type MarkdownCodeProps = JSX.HTMLAttributes<HTMLElement> & {
  /** Код внутри строки текста, а не блоком; признак приносит сам разборщик. */
  inline?: boolean;
};

export function MarkdownCode(props: MarkdownCodeProps) {
  traceLife("ui.markdown-code");

  return (
    <code
      {...dropAddress(dropRendererProps(props))}
      data-inline={props.inline ? "true" : undefined}
      {...anatomyParts.code.attrs}
    />
  );
}
