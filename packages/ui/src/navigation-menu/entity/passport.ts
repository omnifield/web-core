import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { NavigationMenuProps } from "../components";
import { anatomy } from "./anatomy";

const open = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } } as const satisfies PassportState;
const closed = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } } as const satisfies PassportState;
const openClosed: readonly PassportState[] = [open, closed];

const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
const current = { name: "current", mark: { kind: "attribute", name: "data-current" } } as const satisfies PassportState;

const pointerStates: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

const viewportBox = [
  { name: "--viewport-width", setBy: "kit" },
  { name: "--viewport-height", setBy: "kit" },
  { name: "--viewport-x", setBy: "kit" },
  { name: "--viewport-y", setBy: "kit" },
] as const;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [],
      variables: [
        { name: "--trigger-width", setBy: "kit" },
        { name: "--trigger-height", setBy: "kit" },
        { name: "--trigger-x", setBy: "kit" },
        { name: "--trigger-y", setBy: "kit" },
        ...viewportBox,
      ],
    },
    { name: "list", states: [] },
    { name: "item", states: [...openClosed, disabled] },
    { name: "trigger", states: [...openClosed, disabled, ...pointerStates] },
    { name: "content", states: openClosed },
    { name: "link", states: [current, ...pointerStates] },
    { name: "indicator", states: openClosed },
    { name: "itemIndicator", states: openClosed },
    { name: "viewport", states: openClosed, variables: [...viewportBox] },
    { name: "viewportPositioner", states: [] },
    { name: "arrow", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<NavigationMenuProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
