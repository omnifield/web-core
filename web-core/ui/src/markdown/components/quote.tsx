import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";
import { anatomyParts } from "../entity/anatomy";
import { dropRendererProps } from "./renderer-props";

export type MarkdownQuoteProps = JSX.BlockquoteHTMLAttributes<HTMLQuoteElement>;

export function MarkdownQuote(props: MarkdownQuoteProps) {
  traceLife("ui.markdown-quote");

  return <blockquote {...dropAddress(dropRendererProps(props))} {...anatomyParts.quote.attrs} />;
}
