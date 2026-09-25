import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";
import { anatomyParts } from "../entity/anatomy";
import { dropRendererProps } from "./renderer-props";

export type MarkdownParagraphProps = JSX.HTMLAttributes<HTMLParagraphElement>;

export function MarkdownParagraph(props: MarkdownParagraphProps) {
  traceLife("ui.markdown-paragraph");

  return <p {...dropAddress(dropRendererProps(props))} {...anatomyParts.paragraph.attrs} />;
}
