import type { Form, SlotRecipe } from "@web-core/skin/model";

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-normal)",
      },
    },
    heading: {
      props: {
        margin: "0",
        marginBlockStart: "var(--space-6)",
        marginBlockEnd: "var(--space-2)",
        color: "var(--neutral-12)",
        fontWeight: "var(--weight-bold)",
        lineHeight: "var(--leading-tight)",
      },
      states: {
        "level-1": { props: { fontSize: "var(--font-size-xl)" } },
        "level-2": { props: { fontSize: "var(--font-size-lg)" } },
        "level-3": { props: { fontSize: "var(--font-size-md)" } },
        "level-4": { props: { fontSize: "var(--font-size-md)", fontWeight: "var(--weight-semibold)" } },
        "level-5": { props: { fontSize: "var(--font-size-sm)", fontWeight: "var(--weight-semibold)" } },
        "level-6": {
          props: {
            fontSize: "var(--font-size-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--neutral-11)",
          },
        },
      },
    },
    paragraph: {
      props: {
        margin: "0",
        marginBlock: "var(--space-2)",
        lineHeight: "var(--leading-relaxed)",
      },
    },
    list: {
      props: {
        margin: "0",
        marginBlock: "var(--space-2)",
        paddingInlineStart: "var(--space-6)",
        listStyleType: "disc",
      },
      states: {
        ordered: { props: { listStyleType: "decimal" } },
      },
    },
    code: {
      props: {
        display: "block",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontFamily: mono,
        fontSize: "var(--font-size-sm)",
        lineHeight: "var(--leading-snug)",
        overflow: "auto",
      },
      states: {
        inline: {
          props: {
            display: "inline",
            padding: "0",
            paddingInline: "var(--space-1)",
            borderRadius: "var(--radius-sm)",
            overflow: "visible",
          },
        },
      },
    },
    table: {
      props: {
        width: "100%",
        marginBlock: "var(--space-4)",
        borderCollapse: "collapse",
        fontSize: "var(--font-size-sm)",
      },
    },
    quote: {
      props: {
        margin: "0",
        marginBlock: "var(--space-4)",
        paddingInlineStart: "var(--space-4)",
        borderInlineStartWidth: "var(--border-width-2)",
        borderInlineStartStyle: "solid",
        borderInlineStartColor: "var(--neutral-6)",
        color: "var(--neutral-11)",
      },
    },
    link: {
      props: {
        color: "var(--accent-11)",
        textDecorationLine: "underline",
        transition: "color var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { color: "var(--accent-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
      },
    },
  },
  variants: {
    article: {},
    compact: {
      root: { props: { fontSize: "var(--font-size-sm)" } },
      heading: { props: { marginBlockStart: "var(--space-3)", marginBlockEnd: "var(--space-1)" } },
      paragraph: { props: { marginBlock: "var(--space-1)", lineHeight: "var(--leading-normal)" } },
      list: { props: { marginBlock: "var(--space-1)" } },
      quote: { props: { marginBlock: "var(--space-2)" } },
      table: { props: { marginBlock: "var(--space-2)" } },
    },
  },
  defaultVariant: "article",
};

export const form: Form = { name: "markdown-sample", component: "markdown", recipe };
