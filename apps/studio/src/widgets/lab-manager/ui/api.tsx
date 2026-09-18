import { Surface } from "@web-core/ui";
import { ApiConfiguration } from "#/features/lab-manager";

/** Блок правого рейла под фичу «API». Своей логики нет — блок про МЕСТО: он даёт фиче поверхность
 *  в рейле, а имя фичи и переключение между фичами появятся здесь же, когда фич станет больше. */
export function Api() {
  return (
    <Surface>
      <ApiConfiguration />
    </Surface>
  );
}
