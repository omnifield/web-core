import { useSkin } from "@web-core/skin/solid";
import { createSignal } from "@web-core/solid";
import { Button } from "@web-core/ui";

import { Skin } from "../providers/skin";

export function App() {
  const skin = useSkin();
  const [clicks, setClicks] = createSignal(0);

  const mode = () => skin.worn()?.mode ?? "light";
  return (
    <Skin>
      <main>
        <h1>Statboard</h1>
        <p>
          Репозиторий поднялся: пакеты приехали из реестра, сборка собралась,
          экран живой — и одет нарядом из папки со скином.
        </p>
        <Button onClick={() => setClicks(clicks() + 1)}>
          Нажатий: {clicks()}
        </Button>
        <Button
          onClick={() => skin.setMode(mode() === "light" ? "dark" : "light")}
        >
          Половина: {mode() === "light" ? "светлая" : "тёмная"}
        </Button>
      </main>
    </Skin>
  );
}
