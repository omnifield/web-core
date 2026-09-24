import { createAnatomy } from "@web-core/skin/model";

export const anatomy = createAnatomy("diagram").parts(
  "root",
  "axis",
  "grid",
  "line",
  "area",
  "bar",
  "point",
  "arc",
);

export const anatomyParts = anatomy.build();
