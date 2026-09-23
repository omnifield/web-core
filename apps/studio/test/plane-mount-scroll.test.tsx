// Поведение плоскости при монтировании (`shared/ui/plane/plane.tsx`).
//
// Плоскость доезжает до позиции сама, когда её меняют снаружи, — и ровно этот доезд при первой
// отрисовке читался как «матрица уехала сама»: стартовая позиция не переход откуда-то, показывать
// путь из угла (0, 0), в котором плоскость не была, незачем. Здесь закреплено, что первый заход
// встаёт без анимации, а последующие — плавно.

import { createSignal } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Plane, type PlanePosition } from "#/shared/ui/plane";

const VIEWPORT_SIZE = 100;

let dispose: (() => void) | undefined;
let scrollTo: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // jsdom не раскладывает элементы и не умеет скроллить: размеры отдаёт нулями, `scrollTo` не
  // реализован вовсе. Подменяем ровно то, от чего зависит проверяемая ветка.
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    VIEWPORT_SIZE,
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
    VIEWPORT_SIZE,
  );
  scrollTo = vi.fn();
  Element.prototype.scrollTo = scrollTo as unknown as Element["scrollTo"];
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function mountPlane(initial: PlanePosition) {
  const [position, setPosition] = createSignal(initial);
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => (
      <Plane
        columns={["a", "b", "c"]}
        rows={["x", "y"]}
        position={position()}
        onMove={setPosition}
      >
        {(cell) => <>{`${cell.column}${cell.row}`}</>}
      </Plane>
    ),
    host,
  );
  return setPosition;
}

describe("Plane — первая посадка без анимации", () => {
  it("встаёт в стартовую позицию мгновенно, а не свайпом от нуля", () => {
    mountPlane({ column: 2, row: 1 });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * VIEWPORT_SIZE,
      top: 1 * VIEWPORT_SIZE,
      behavior: "instant",
    });
  });

  it("следующая смена позиции снаружи доезжает плавно", () => {
    const setPosition = mountPlane({ column: 2, row: 1 });
    scrollTo.mockClear();

    // Скролл в jsdom не двигается (`scrollTo` подменён), поэтому целимся туда, где плоскость
    // заведомо не стоит: иначе эффект справедливо решит, что ехать некуда.
    setPosition({ column: 1, row: 0 });

    expect(scrollTo).toHaveBeenCalledWith({
      left: 1 * VIEWPORT_SIZE,
      top: 0,
      behavior: "smooth",
    });
  });

  it("стартовая позиция (0, 0) не дёргает скролл вовсе", () => {
    mountPlane({ column: 0, row: 0 });

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
