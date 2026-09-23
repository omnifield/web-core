import { defineQuery } from "@web-core/query";
import { variantsOf as variantsOfOutfit } from "@web-core/skin/presets";
import { presetsClient, queryClient } from "#/shared/api/clients";

export const palettesOf = defineQuery(
  queryClient,
  () => ["palettes"],
  () => presetsClient.list("palette"),
  { staleTime: Infinity },
);

export const assembliesOf = defineQuery(
  queryClient,
  (componentName: string) => ["assemblies", componentName],
  (componentName: string) =>
    presetsClient.list("assembly", { component: [componentName] }),
  { staleTime: Infinity },
);

export const variantsOf = defineQuery(
  queryClient,
  (componentName: string) => ["variants", componentName],
  (componentName: string) => variantsOfOutfit(presetsClient, componentName),
  { staleTime: Infinity },
);

export const outfitsOf = defineQuery(
  queryClient,
  () => ["outfits"],
  () => presetsClient.list("outfit"),
  { staleTime: Infinity },
);

/** Только заголовки: списку записей нужны имя и ярлык, а тела у данных показа бывают тяжёлыми и
 *  их может быть много — человек выберет одну, а то и ни одной. */
export const contentOf = defineQuery(
  queryClient,
  (componentName: string) => ["content", componentName],
  (componentName: string) =>
    presetsClient.listHeaders("content", { component: [componentName] }),
  { staleTime: Infinity },
);

/** Тело одной записи — по её имени, отдельным ключом: приезжает, когда её выбрали. */
export const contentRecordOf = defineQuery(
  queryClient,
  (name: string) => ["content", "record", name],
  (name: string) => presetsClient.get("content", name),
  { staleTime: Infinity },
);

export function tagsOf() {
  return presetsClient.list("tag");
}
