import { createSignal, type JSX, Show } from "solid-js";
import { createPresetsSkinSource } from "@web-core/skin/presets";
import { SkinProvider as SkinProviderBase } from "@web-core/skin/solid";
import { passportOf } from "@web-core/ui/passport";
import { presetsClient } from "#/shared/api/clients";

const DEFAULT_SKIN = "omnifield";

// Клиент тот же, что у остального приложения: иначе скин заводит свою сеть и качает формы
// компонентов вторым путём, мимо кэша (см. FAQ.md).
const SKIN_SOURCE = createPresetsSkinSource({
  client: presetsClient,
  lookup: passportOf,
});

// Роутер (и его лоадеры) монтируется ВНУТРИ этого провайдера — держим детей непоказанными, пока
// наряд не восстановлен (`onReady`), иначе лоадер первого захода стартует раньше скин-коннекшена
// и навсегда кэширует пустой результат (staleTime: Infinity) под своим ключом.
export function SkinProvider(props: { children?: JSX.Element }) {
  const [ready, setReady] = createSignal(false);

  return (
    <SkinProviderBase
      source={SKIN_SOURCE}
      options={{ fallback: { skin: DEFAULT_SKIN, mode: "light" } }}
      onReady={(promise) => {
        void promise.then(() => setReady(true));
      }}
    >
      <Show when={ready()}>{props.children}</Show>
    </SkinProviderBase>
  );
}
