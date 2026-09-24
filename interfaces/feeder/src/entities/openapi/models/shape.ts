import { API_KIND } from "./kind";

export const API_SHAPE = {
  kind: API_KIND,
  type: "Api",
  fields: ["endpoints", "groups", "defs"],
} as const;
