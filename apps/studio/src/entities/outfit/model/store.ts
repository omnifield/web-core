import { createActionStore } from "@web-core/store";
import { mutate } from "@web-core/store/mutate";

interface OutfitState {
  readonly outfit?: string;
}

/** Какой наряд надет сейчас. Один на приложение: наряд не свойство компонента. */
export const outfitStore = createActionStore<
  OutfitState,
  {
    setOutfit(name: string | undefined): void;
  }
>({}, ({ setState }) => ({
  setOutfit(outfit) {
    setState(
      mutate<OutfitState>((draft) => {
        draft.outfit = outfit;
      }),
    );
  },
}));
