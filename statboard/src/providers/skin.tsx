import { withPassports } from "@web-core/skin";
import type { Form, Outfit, Palette } from "@web-core/skin/model";
import { SkinProvider } from "@web-core/skin/solid";
import type { SkinSource } from "@web-core/skin/wear";
import type { ParentProps } from "@web-core/solid";
import { passportOf } from "@web-core/ui/passport";

import outfitJson from "../../skin/outfit.json";
import paletteJson from "../../skin/palette.json";

const outfit = outfitJson as unknown as Outfit;
const palette = paletteJson as unknown as Palette;

const forms = Object.values(
  import.meta.glob<Form>("../../skin/forms/*.json", {
    eager: true,
    import: "default",
  }),
);

const { assemble, generateSkinCss } = withPassports(passportOf);

const source: SkinSource = {
  names: () => [outfit.name],
  css: () =>
    generateSkinCss(assemble(outfit, { palettes: [palette], forms }).skin),
};

export function Skin(props: ParentProps) {
  return (
    <SkinProvider
      source={source}
      options={{ fallback: { skin: outfit.name, mode: "light" } }}
    >
      {props.children}
    </SkinProvider>
  );
}
