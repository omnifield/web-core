import { splitProps, type JSX } from "@web-core/solid";
import remarkGfm from "remark-gfm";
import { SolidMarkdown, type SolidMarkdownComponents } from "solid-markdown";

import { useKitLife } from "../../shared/utils/skin-life";
import { slotAware, useAddress } from "../../shared/utils/slot-chain";
import { anatomyParts } from "../entity/anatomy";
import { passport } from "../entity/passport";
import { MarkdownCode } from "./code";
import { MarkdownHeading } from "./heading";
import { MarkdownLink } from "./link";
import { MarkdownList } from "./list";
import { MarkdownParagraph } from "./paragraph";
import { MarkdownQuote } from "./quote";
import { MarkdownTable } from "./table";

// Подпись частей документа объявляет `children` списком компонентов, а передаёт отрисованный
// узел — разбор в `FAQ.md` зоны, поэтому карта приводится один раз здесь, а не в семи файлах.
// Таблицы, зачёркивание и списки-галочки — расширение разметки, базовый разбор их не видит вовсе.
const PLUGINS = [remarkGfm];

const DOCUMENT = {
  h1: MarkdownHeading,
  h2: MarkdownHeading,
  h3: MarkdownHeading,
  h4: MarkdownHeading,
  h5: MarkdownHeading,
  h6: MarkdownHeading,
  p: MarkdownParagraph,
  ul: MarkdownList,
  ol: MarkdownList,
  code: MarkdownCode,
  table: MarkdownTable,
  blockquote: MarkdownQuote,
  a: MarkdownLink,
} as unknown as SolidMarkdownComponents;

export type MarkdownProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /** Текст документа. Разметку внутри него выбирает источник, а не кит. */
  text?: string;
};

export const Markdown = slotAware(function Markdown(props: MarkdownProps) {
  useKitLife(passport, props);

  const [local, others] = splitProps(props, ["text", "children"]);
  const [address, rest] = useAddress(others, anatomyParts.root.attrs);

  return (
    <div {...rest} {...address}>
      <SolidMarkdown components={DOCUMENT} remarkPlugins={PLUGINS} children={local.text ?? ""} />
    </div>
  );
});
