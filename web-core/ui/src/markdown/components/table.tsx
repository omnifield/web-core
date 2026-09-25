import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";
import { anatomyParts } from "../entity/anatomy";
import { dropRendererProps } from "./renderer-props";

export type MarkdownTableProps = JSX.HTMLAttributes<HTMLTableElement>;

export function MarkdownTable(props: MarkdownTableProps) {
  traceLife("ui.markdown-table");

  return <table {...dropAddress(dropRendererProps(props))} {...anatomyParts.table.attrs} />;
}
