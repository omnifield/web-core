import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";
import { anatomyParts } from "../entity/anatomy";
import { dropRendererProps } from "./renderer-props";

export type MarkdownLinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement>;

export function MarkdownLink(props: MarkdownLinkProps) {
  traceLife("ui.markdown-link");

  return <a {...dropAddress(dropRendererProps(props))} {...anatomyParts.link.attrs} />;
}
