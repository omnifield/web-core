// Операции пакета над своими понятиями — двояко: голой функцией и `toolDefinition()`-обёрткой
// рядом. `.server(execute)` здесь не зовётся, `lookup`/`passports` в `inputSchema` не входят —
// разбор в FAQ.md, «Тулы для агента».

import { z } from "@web-core/io";
import { toolDefinition } from "@web-core/neurobox/tool";
import type { ToolDefinition } from "@tanstack/ai";
import {
  AssembledSchema,
  LookPartsSchema,
  OutfitFlawSchema,
  OutfitSchema,
  SkinGapSchema,
  SkinSchema,
  ValueVocabularySchema,
} from "./schemas.js";

export { assemble, checkOutfit } from "../engine/look/index.js";
export { generateSkinCss } from "../engine/generate/index.js";
export { skinGaps } from "../engine/coverage/index.js";

// Схемы — именованными константами, не литералом в вызове: без `typeof`-ссылки эмит деклараций не
// собирается. Разбор — FAQ.md.
const OutfitPartsInput = z.object({ outfit: OutfitSchema, parts: LookPartsSchema });
const OutfitFlawsOutput = z.array(OutfitFlawSchema);
const GenerateSkinCssInput = z.object({ skin: SkinSchema, vocabulary: ValueVocabularySchema.optional() });
const SkinInput = z.object({ skin: SkinSchema });
const SkinGapsOutput = z.array(SkinGapSchema);

export const checkOutfitTool: ToolDefinition<typeof OutfitPartsInput, typeof OutfitFlawsOutput, "check_outfit"> =
  toolDefinition({
    name: "check_outfit",
    description: "проверяет наряд против палитры/форм: незакрытый словарь, неизвестные имена, коллизии keyframes",
    access: "read",
    inputSchema: OutfitPartsInput,
    outputSchema: OutfitFlawsOutput,
  });

export const assembleOutfitTool: ToolDefinition<typeof OutfitPartsInput, typeof AssembledSchema, "assemble_outfit"> =
  toolDefinition({
    name: "assemble_outfit",
    description: "собирает наряд (палитра+формы) в скин — значения на координатах компонентов",
    access: "read",
    inputSchema: OutfitPartsInput,
    outputSchema: AssembledSchema,
  });

export const generateSkinCssTool: ToolDefinition<typeof GenerateSkinCssInput, z.ZodString, "generate_skin_css"> =
  toolDefinition({
    name: "generate_skin_css",
    description: "печатает CSS собранного скина",
    access: "read",
    inputSchema: GenerateSkinCssInput,
    outputSchema: z.string(),
  });

export const skinGapsTool: ToolDefinition<typeof SkinInput, typeof SkinGapsOutput, "skin_gaps"> = toolDefinition({
  name: "skin_gaps",
  description: "покрытие координат скина значением — какие компонент/часть/состояние остались без стиля",
  access: "read",
  inputSchema: SkinInput,
  outputSchema: SkinGapsOutput,
});
