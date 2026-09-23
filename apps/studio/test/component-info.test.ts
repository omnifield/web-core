// `useInfo` (`entities/component/use`) — единственный вход к сведениям о компоненте: синхронный
// срез берётся из ячейки семьи, асинхронный — из кэша запросов. Здесь проверяется адресация
// (активная ячейка против названной) и то, что без таргета запрос не отпускается в сеть.
//
// Сам кэш замокан: поведение `enabled` — забота `@web-core/query`, у него свой прогон. Здесь
// ловится наше: с каким `enabled` запрос зовут.

import { createRoot } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { componentStoreOf, useInfo } from "#/entities/component";

const asked: { enabled: boolean }[] = [];
const pending = { variants: false, content: false };

vi.mock("#/entities/component/api", () => {
  const answering =
    (of: "variants" | "content") =>
    (_arg?: () => string, options?: () => { enabled: boolean }) => {
      const chosen = options?.();
      if (chosen !== undefined) asked.push(chosen);
      return { data: [], isPending: pending[of], error: null };
    };

  return {
    variantsOf: Object.assign(() => Promise.resolve([]), {
      use: answering("variants"),
    }),
    contentOf: Object.assign(() => Promise.resolve([]), {
      use: answering("content"),
    }),
  };
});

beforeEach(() => {
  asked.length = 0;
  pending.variants = false;
  pending.content = false;
  componentStoreOf.activate(undefined);
});

describe("useInfo", () => {
  it("без имени отвечает про активную ячейку и переезжает за активацией", () => {
    createRoot((dispose) => {
      const info = useInfo();
      expect(info.name()).toBe("");

      componentStoreOf.activate("button");
      expect(info.name()).toBe("button");
      expect(info.passport()).toBeDefined();

      componentStoreOf.activate("checkbox");
      expect(info.name()).toBe("checkbox");

      dispose();
    });
  });

  it("с именем отвечает про названный компонент, активный его не трогает", () => {
    createRoot((dispose) => {
      const info = useInfo("button");

      componentStoreOf.activate("checkbox");
      expect(info.name()).toBe("button");

      dispose();
    });
  });

  it("ожидания раздельные: медленные записи не держат приехавшие варианты", () => {
    pending.content = true;

    createRoot((dispose) => {
      componentStoreOf.activate("button");
      const info = useInfo();

      expect(info.variants.isPending()).toBe(false);
      expect(info.content.isPending()).toBe(true);

      dispose();
    });
  });

  it("без таргета запрос не отпускается, с таргетом отпускается", () => {
    createRoot((dispose) => {
      const info = useInfo();

      // Оба запроса — варианты и записи данных.
      expect(asked).toHaveLength(2);
      expect(asked.every((options) => !options.enabled)).toBe(true);
      // Ожидания без таргета нет: `enabled: false` держал бы запрос в `pending` вечно.
      expect(info.variants.isPending()).toBe(false);
      expect(info.content.isPending()).toBe(false);

      asked.length = 0;
      componentStoreOf.activate("button");
      // Опции читаются на каждый такт — достаточно позвать их заново.
      const info2 = useInfo();
      expect(info2.name()).toBe("button");
      expect(asked).toHaveLength(2);
      expect(asked.every((options) => options.enabled)).toBe(true);

      dispose();
    });
  });
});
