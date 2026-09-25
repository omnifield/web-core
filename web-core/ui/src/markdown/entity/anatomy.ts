import { createAnatomy } from "@web-core/skin/model";

import { parts } from "../../shared/data/anatomy";

export const anatomy = createAnatomy("markdown").parts("root", ...parts.document);

export const anatomyParts = anatomy.build();
