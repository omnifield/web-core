export { Markdown, type MarkdownProps } from "./root";
export { MarkdownHeading, type MarkdownHeadingProps } from "./heading";
export { MarkdownParagraph, type MarkdownParagraphProps } from "./paragraph";
export { MarkdownList, type MarkdownListProps } from "./list";
export { MarkdownCode, type MarkdownCodeProps } from "./code";
export { MarkdownTable, type MarkdownTableProps } from "./table";
export { MarkdownQuote, type MarkdownQuoteProps } from "./quote";
export { MarkdownLink, type MarkdownLinkProps } from "./link";

import { defineKitComponent, type PartComponent } from "../../kit-form";
import { passport } from "../entity/passport";
import { MarkdownCode } from "./code";
import { MarkdownHeading } from "./heading";
import { MarkdownLink } from "./link";
import { MarkdownList } from "./list";
import { MarkdownParagraph } from "./paragraph";
import { MarkdownQuote } from "./quote";
import { Markdown } from "./root";
import { MarkdownTable } from "./table";

export const kit = defineKitComponent(passport, {
  root: Markdown as PartComponent,
  heading: MarkdownHeading,
  paragraph: MarkdownParagraph,
  list: MarkdownList,
  code: MarkdownCode,
  table: MarkdownTable,
  quote: MarkdownQuote,
  link: MarkdownLink,
});
