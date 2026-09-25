import { createSignal, For, Show } from "@web-core/solid";
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  Surface,
  Typography,
} from "@web-core/ui";
import type { ComponentDocs } from "@web-core/ui/docs";
import { useDocs } from "#/entities/component";
import { MarkdownView } from "#/shared/ui/markdown";

type Paper = keyof ComponentDocs;

const PAPERS: readonly { value: Paper; label: string }[] = [
  { value: "readme", label: "README" },
  { value: "faq", label: "FAQ" },
  { value: "examples", label: "Примеры" },
  { value: "roadmap", label: "ROADMAP" },
];

/** Дока активного компонента рядом с его показом: четыре документа поставки, переключение между
 *  ними показ не трогает. */
export function Docs() {
  const docs = useDocs();
  const [paper, setPaper] = createSignal<Paper>("readme");
  const text = () => docs.data()[paper()];

  return (
    <Surface data-variant="filled">
      <SegmentGroup
        orientation="horizontal"
        value={paper()}
        onValueChange={(details) => {
          if (details.value) setPaper(details.value as Paper);
        }}
      >
        <SegmentGroupIndicator />
        <For each={PAPERS}>
          {(item) => (
            <SegmentGroupItem value={item.value}>
              <SegmentGroupItemControl />
              <SegmentGroupItemText>{item.label}</SegmentGroupItemText>
            </SegmentGroupItem>
          )}
        </For>
      </SegmentGroup>

      <Show
        when={!docs.isPending()}
        fallback={<Typography>Документ едет…</Typography>}
      >
        <Show
          when={paper() === "roadmap"}
          fallback={<MarkdownView text={text()} empty="документа нет" />}
        >
          {/* Ямл показывается как есть: разбирать его нечем, а перенос строк здесь и есть
              содержание. */}
          <pre style={{ margin: 0, "white-space": "pre-wrap" }}>
            {text() ?? "документа нет"}
          </pre>
        </Show>
      </Show>
    </Surface>
  );
}
