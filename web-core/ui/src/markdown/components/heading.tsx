import type { JSX } from "@web-core/solid";
import { Dynamic } from "@web-core/solid/web";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";
import { anatomyParts } from "../entity/anatomy";
import { dropRendererProps } from "./renderer-props";

const TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

export type MarkdownHeadingProps = JSX.HTMLAttributes<HTMLHeadingElement> & {
  /** Уровень из самого документа; вне документа заголовок остаётся первого уровня. */
  level?: number;
};

export function MarkdownHeading(props: MarkdownHeadingProps) {
  traceLife("ui.markdown-heading");

  const level = () => Math.min(Math.max(Math.trunc(props.level ?? 1), 1), TAGS.length);

  return (
    <Dynamic
      component={TAGS[level() - 1]!}
      {...dropAddress(dropRendererProps(props))}
      data-level={String(level())}
      {...anatomyParts.heading.attrs}
    />
  );
}
