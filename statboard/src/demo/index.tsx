import { useSkin } from "@web-core/skin/solid";
import { createSignal } from "@web-core/solid";
import { Button, Flow, Surface, Typography } from "@web-core/ui";

export function Demo() {
  const skin = useSkin();
  const [clicks, setClicks] = createSignal(0);

  const mode = () => skin.worn()?.mode ?? "light";

  return (
    <Surface data-variant="filled">
      <Flow data-variant="column">
        <Typography as="h1" data-variant="display">
          Statboard
        </Typography>
        <Typography data-variant="body">
          Экран собран компонентами кита и одет нарядом из папки со скином:
          поверхность, типографика, раскладка и кнопки — всё оттуда.
        </Typography>

        <Flow data-variant="row">
          <Button
            data-variant="primary"
            onClick={() => setClicks(clicks() + 1)}
          >
            Нажатий: {clicks()}
          </Button>
          <Button
            data-variant="secondary"
            onClick={() => skin.setMode(mode() === "light" ? "dark" : "light")}
          >
            Тема: {mode() === "light" ? "светлая" : "тёмная"}
          </Button>
        </Flow>

        <Typography data-variant="caption">
          Ни одного своего CSS-правила в этом файле нет.
        </Typography>
      </Flow>
    </Surface>
  );
}
