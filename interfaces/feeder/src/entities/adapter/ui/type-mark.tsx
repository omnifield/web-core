import { layoutGroup } from "@web-core/skin";
import { Flow, Icon, type IconProps } from "@web-core/ui";

interface Mark {
  readonly icon: IconProps["name"];
  readonly category: string;
}

const MARKS: Readonly<Record<string, Mark>> = {
  string: { icon: "type", category: "type-string" },
  number: { icon: "hash", category: "type-number" },
  integer: { icon: "hash", category: "type-number" },
  boolean: { icon: "toggle-left", category: "type-boolean" },
  enum: { icon: "list", category: "type-enum" },
};

const UNKNOWN: Mark = { icon: "circle-question-mark", category: "type-unknown" };

export function TypeMark(props: { type: string }) {
  const mark = () => MARKS[props.type] ?? UNKNOWN;

  return (
    <Flow
      title={props.type}
      data-mark={mark().category}
      style={{
        ...layoutGroup({ align: "center", justify: "center", wrap: false }),
        border: `var(--border-width) solid var(--${mark().category}-7)`,
        "border-radius": "var(--radius)",
        padding: "0 var(--space-1)",
        color: `var(--${mark().category}-11)`,
        background: `var(--${mark().category}-4)`,
      }}
    >
      <Icon name={mark().icon} />
    </Flow>
  );
}
