import type { PassportLookup } from "../engine/address/index.js";
import { withPassports } from "../engine/generate/index.js";
import type { SkinSource } from "../wear/switch.js";

import { createPresetsClient, PRESET_KIND, type PresetsClient } from "./client/index.js";
import { createLazyComponentSkin } from "./lazy.js";
import { PresetsRefused } from "./wire.js";

export interface PresetsSkinSourceByUrl {
  readonly url: string;
  readonly lookup: PassportLookup;
}

export interface PresetsSkinSourceByClient {
  readonly client: PresetsClient;
  readonly lookup: PassportLookup;
}

export type PresetsSkinSourceOptions = PresetsSkinSourceByUrl | PresetsSkinSourceByClient;

export function createPresetsSkinSource(options: PresetsSkinSourceOptions): SkinSource {
  const { lookup } = options;
  const client = "client" in options ? options.client : createPresetsClient({ url: options.url });
  const { assemble, generateSkinCss } = withPassports(lookup);

  return {
    names: async () => (await client.list(PRESET_KIND.outfit)).map((record) => record.name),
    css: async (name) => {
      const outfit = await client.get(PRESET_KIND.outfit, name);
      if (outfit === undefined) {
        throw new PresetsRefused(`наряда «${name}» в службе раздачи нет — надевать нечего`);
      }

      const palettes = await client.list(PRESET_KIND.palette);

      return generateSkinCss(
        assemble(
          { ...outfit.state, forms: [] },
          { palettes: palettes.map((record) => record.state), forms: [] },
        ).skin,
      );
    },
    components: createLazyComponentSkin({ client, lookup }),
  };
}
