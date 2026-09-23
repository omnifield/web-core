import { z } from "@web-core/io";
import { fields } from "../../shared/data/fields";

const item = z.object({ value: fields.item.value, label: fields.item.label });

export const input = z.object({ items: z.array(item) });

export const output = z.object({});

export type Data = z.infer<typeof input>;
