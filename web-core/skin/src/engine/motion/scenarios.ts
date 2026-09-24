
import type { Keyframes } from "../recipe/index.js";

/** Готовые ступени движения «вырасти/сжаться по измеренному размеру». Имена ступеней фиксированы,
 *  `--height`/`--width` кладёт на узел кит — разбор в FAQ.md, «Готовые сценарии движения». */
export const GROW_SHRINK_BLOCK: Keyframes = {
  "grow-block-size": {
    from: { blockSize: "0" },
    to: { blockSize: "var(--height)" },
  },
  "shrink-block-size": {
    from: { blockSize: "var(--height)" },
    to: { blockSize: "0" },
  },
};

export const GROW_SHRINK_INLINE: Keyframes = {
  "grow-inline-size": {
    from: { inlineSize: "0" },
    to: { inlineSize: "var(--width)" },
  },
  "shrink-inline-size": {
    from: { inlineSize: "var(--width)" },
    to: { inlineSize: "0" },
  },
};
