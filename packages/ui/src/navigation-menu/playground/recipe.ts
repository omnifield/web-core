import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";
const slide = "translate var(--motion-normal) var(--ease-out), width var(--motion-normal) var(--ease-out)";
const resize = "width var(--motion-normal) var(--ease-out), height var(--motion-normal) var(--ease-out)";

const focusRing = {
  props: {
    outline: "var(--border-width-2) solid var(--accent-8)",
    outlineOffset: "calc(var(--border-width-2) * -1)",
  },
} as const;

// Коробка попапа — один в один со списком селекта: это один и тот же вид всплывающей панели.
const panel = {
  background: "var(--neutral-1)",
  borderWidth: "var(--border-width-1)",
  borderStyle: "solid",
  borderColor: "var(--neutral-6)",
  borderRadius: "var(--radius-md)",
} as const;

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { position: "relative", inlineSize: "max-content" },
    },
    list: {
      props: {
        position: "relative",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "var(--space-1)",
        listStyle: "none",
      },
    },
    item: {
      props: { position: "static" },
      // Числовой `z-index` здесь накрывает указатель — разбор в `../FAQ.md`.
      states: {
        open: { props: { zIndex: "auto" } },
        closed: { props: { zIndex: "auto" } },
        disabled: { props: { cursor: "not-allowed" } },
      },
    },
    trigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minBlockSize: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        whiteSpace: "nowrap",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { background: "var(--neutral-3)", color: "var(--neutral-12)" } },
        closed: { props: { background: "transparent" } },
        hover: { props: { background: "var(--neutral-3)", color: "var(--neutral-12)" } },
        "focus-visible": focusRing,
        active: { props: { background: "var(--neutral-4)" } },
        disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
      },
    },
    content: {
      props: {
        position: "absolute",
        insetBlockStart: "100%",
        insetInlineStart: "0",
        marginBlockStart: "var(--space-1)",
        inlineSize: "max-content",
        flexDirection: "column",
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        overflow: "auto",
        ...panel,
      },
      states: {
        open: { props: { display: "flex" } },
        closed: { props: { display: "none" } },
      },
      // Внутри общей панели коробку несёт она сама — иначе рамка в рамке.
      ancestors: [
        {
          component: "navigation-menu",
          part: "viewport",
          style: {
            props: {
              insetBlockStart: "0",
              insetInlineStart: "0",
              marginBlockStart: "0",
              borderWidth: "0",
              borderRadius: "0",
              background: "transparent",
            },
          },
        },
      ],
    },
    link: {
      props: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        paddingBlock: "var(--space-1)",
        paddingInline: "var(--space-2)",
        borderRadius: "var(--radius-sm)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-tight)",
        textDecoration: "none",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        current: { props: { color: "var(--accent-11)", fontWeight: "var(--weight-medium)" } },
        hover: { props: { background: "var(--neutral-4)" } },
        "focus-visible": focusRing,
        active: { props: { background: "var(--neutral-5)" } },
      },
    },
    indicator: {
      props: {
        position: "absolute",
        insetBlockEnd: "0",
        insetInlineStart: "0",
        blockSize: "var(--border-width-2)",
        borderRadius: "var(--radius-full)",
        background: "var(--accent-9)",
        transition: slide,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { display: "flex", justifyContent: "center", opacity: "1" } },
        closed: { props: { opacity: "0" } },
      },
      ancestors: [
        {
          component: "navigation-menu",
          part: "root",
          style: {
            props: { inlineSize: "var(--trigger-width)", translate: "var(--trigger-x) 0" },
          },
        },
      ],
    },
    itemIndicator: {
      props: {
        inlineSize: "1em",
        blockSize: "1em",
        color: "var(--accent-11)",
      },
      states: {
        open: { props: { display: "inline-flex" } },
        closed: { props: { opacity: "0" } },
      },
    },
    viewportPositioner: {
      props: {
        position: "absolute",
        insetBlockStart: "100%",
        insetInlineStart: "0",
        inlineSize: "100%",
        display: "flex",
        pointerEvents: "none",
      },
    },
    viewport: {
      props: {
        position: "relative",
        flex: "none",
        marginBlockStart: "var(--space-1)",
        inlineSize: "var(--viewport-width)",
        blockSize: "var(--viewport-height)",
        overflow: "hidden",
        pointerEvents: "auto",
        transition: resize,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        ...panel,
      },
      states: {
        open: { props: { display: "block", opacity: "1" } },
        closed: { props: { opacity: "0" } },
      },
    },
    arrow: {
      props: {
        position: "relative",
        insetBlockStart: "var(--border-width-1)",
        inlineSize: "var(--space-3)",
        blockSize: "var(--space-3)",
        rotate: "45deg",
        background: "var(--neutral-1)",
        borderBlockStart: "var(--border-width-1) solid var(--neutral-6)",
        borderInlineStart: "var(--border-width-1) solid var(--neutral-6)",
      },
    },
  },
  settings: {
    orientation: {
      vertical: {
        list: { props: { flexDirection: "column", alignItems: "stretch" } },
        content: {
          props: {
            insetBlockStart: "0",
            insetInlineStart: "100%",
            marginBlockStart: "0",
            marginInlineStart: "var(--space-2)",
          },
        },
        indicator: {
          props: {
            insetBlockEnd: "auto",
            insetInlineEnd: "0",
            insetInlineStart: "auto",
            inlineSize: "var(--border-width-2)",
          },
          ancestors: [
            {
              component: "navigation-menu",
              part: "root",
              style: {
                props: { blockSize: "var(--trigger-height)", translate: "0 var(--trigger-y)" },
              },
            },
          ],
        },
        viewportPositioner: { props: { insetBlockStart: "0", insetInlineStart: "100%", inlineSize: "auto" } },
      },
    },
  },
};

export const form: Form = { name: "navigation-menu-sample", component: "navigation-menu", recipe };
