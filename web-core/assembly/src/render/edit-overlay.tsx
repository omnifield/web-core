// см. README.md / FAQ.md

import { type Component, type JSX } from "@web-core/solid";
import { createComponent } from "@web-core/solid/web";

import type { AssemblyElement, AssemblyNode, AssemblyReference, NodeId } from "../engine/tree.js";
import type { EditOverlayProps } from "./types.js";

/** Украшение СНАРУЖИ путей отрисовки — абсолютно спозиционированный слой поверх узла, `node`
 * передаётся аксессором (не значением), чтобы `nodeId`/`node` оставались живыми геттерами и
 * пересчитывались реактивно, не застывали на момент вызова. */
export function overlay(
  EditOverlay: Component<EditOverlayProps>,
  node: () => AssemblyNode | undefined,
  fallbackId: NodeId,
): JSX.Element {
  return (
    <span style={{ position: "absolute", inset: 0, "pointer-events": "none" }} aria-hidden="true">
      {createComponent(EditOverlay, {
        get nodeId() {
          return node()?.id ?? fallbackId;
        },
        get node() {
          return node() as AssemblyElement | AssemblyReference;
        },
      })}
    </span>
  );
}

/** Узел, не пускающий содержимое, получает оверлей обёрткой — `display:block`, не
 * `display:contents` (иначе `position:relative` браузер бы проигнорировал, оверлей растянулся бы
 * по родителю). */
export function wrapped(
  body: JSX.Element,
  EditOverlay: Component<EditOverlayProps>,
  node: () => AssemblyNode | undefined,
  fallbackId: NodeId,
): JSX.Element {
  return (
    <span style={{ display: "block", position: "relative" }}>
      {body}
      {overlay(EditOverlay, node, fallbackId)}
    </span>
  );
}
