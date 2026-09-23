import { createRoot, createSignal, onCleanup } from "solid-js";
import { describe, expect, it } from "vitest";

import {
  createCallback,
  createDisposable,
  createHydratableSingletonRoot,
  createRootPool,
  createSingletonRoot,
  createSubRoot,
} from "../src/rootless/index";

describe("@web-core/solid/rootless", () => {
  it("createSingletonRoot строит начинку один раз на всех потребителей", () => {
    let built = 0;
    const useShared = createSingletonRoot(() => {
      built += 1;
      return createSignal(0);
    });

    createRoot(() => {
      const first = useShared();
      const second = useShared();
      expect(first).toBe(second);
    });

    expect(built).toBe(1);
  });

  it("createSingletonRoot гасит корень, когда ушёл последний слушатель, и строит заново для следующего", async () => {
    let built = 0;
    let disposed = 0;
    const useShared = createSingletonRoot(() => {
      built += 1;
      onCleanup(() => {
        disposed += 1;
      });
      return built;
    });

    const disposeFirst = createRoot((dispose) => {
      useShared();
      return dispose;
    });
    const disposeSecond = createRoot((dispose) => {
      useShared();
      return dispose;
    });

    expect(built).toBe(1);

    disposeFirst();
    await Promise.resolve();
    expect(disposed).toBe(0);

    disposeSecond();
    expect(disposed).toBe(0);
    await Promise.resolve();
    expect(disposed).toBe(1);

    createRoot((dispose) => {
      expect(useShared()).toBe(2);
      dispose();
    });
    expect(built).toBe(2);
  });

  it("корень переживает мгновенную перецепку слушателя — гашение отложено на микротаск", async () => {
    let built = 0;
    const useShared = createSingletonRoot(() => ++built);

    const disposeFirst = createRoot((dispose) => {
      useShared();
      return dispose;
    });

    disposeFirst();
    const disposeSecond = createRoot((dispose) => {
      expect(useShared()).toBe(1);
      return dispose;
    });

    await Promise.resolve();
    expect(built).toBe(1);
    disposeSecond();
  });

  it("createSubRoot уничтожается вместе с владельцем", () => {
    let cleaned = 0;

    const dispose = createRoot((disposeOwner) => {
      createSubRoot(() => {
        onCleanup(() => {
          cleaned += 1;
        });
      });
      return disposeOwner;
    });

    expect(cleaned).toBe(0);
    dispose();
    expect(cleaned).toBe(1);
  });

  it("createSubRoot отдаёт свою ручку — корень гасится раньше владельца", () => {
    let cleaned = 0;

    const dispose = createRoot((disposeOwner) => {
      const disposeSub = createSubRoot<() => void>((disposeSelf) => {
        onCleanup(() => {
          cleaned += 1;
        });
        return disposeSelf;
      });

      disposeSub();
      expect(cleaned).toBe(1);
      return disposeOwner;
    });

    dispose();
    expect(cleaned).toBe(1);
  });

  it("createCallback даёт владельца коду, который зовут снаружи реактивного контекста", () => {
    let cleaned = 0;
    let fire!: () => void;

    const dispose = createRoot((disposeOwner) => {
      fire = createCallback(() => {
        onCleanup(() => {
          cleaned += 1;
        });
      });
      return disposeOwner;
    });

    fire();
    expect(cleaned).toBe(0);

    dispose();
    expect(cleaned).toBe(1);
  });

  it("подпуть отдаёт весь состав вендора", () => {
    for (const exported of [
      createSubRoot,
      createCallback,
      createDisposable,
      createSingletonRoot,
      createHydratableSingletonRoot,
      createRootPool,
    ]) {
      expect(exported).toBeTypeOf("function");
    }
  });
});
