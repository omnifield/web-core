// ГЕЙТ ПРОСТРАНСТВЕННЫХ РОЛЕЙ (`PWEB-198`) — тот же довод, что у `kit.test.tsx`: расхождение
// обязано ловиться у поставщика один раз, а не находиться архитектором ревизией по памяти.
//
// НАЙДЕНО РЕВИЗИЕЙ (2026-08-30, `packages/style/src/dimension.ts`, `SPACE_ROLES`): почти весь
// кит держит `paddingInline: var(--space-4)` в паре с `control-height-md` и `var(--space-3)` в
// паре с `control-height-sm` — но `field`, `date-picker` (дважды) и `table`'s `headerSortTrigger`
// разъехались с этим большинством молча, и разъезд нашёлся только ручным чтением всех 19
// `playground/recipe.ts`. Починено этим же заходом; проба здесь — чтобы следующий разъезд нашёл
// не архитектор глазами, а прогон.
//
// СПОСОБ: читаем ВСЕ `props`-объекты рецепта (обходом дерева, а не по именам частей — частей у
// каждого компонента свои) и проверяем инвариант там, где он применим (пара `minHeight`/
// `minBlockSize` + `paddingInline` присутствует ОБА разом). Часть без набивки по горизонтали
// (например только `paddingBlock`) инвариант не нарушает — ему просто нечего проверить.

import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** Ступень высоты → набивка и шрифт, которые едут ВМЕСТЕ с ней (`packages/style` `SPACE_ROLES`,
 *  таблица видов частей — `README.md` зоны, раздел «Рецепт»). */
const CONTROL: Readonly<Record<string, { readonly paddingInline: string; readonly fontSize: string }>> = {
  "var(--control-height-md)": { paddingInline: "var(--space-4)", fontSize: "var(--font-size-md)" },
  "var(--control-height-sm)": { paddingInline: "var(--space-3)", fontSize: "var(--font-size-sm)" },
};

/** Набивка строки списка — одна на все списки кита, независимо от компонента. */
const ROW = { paddingInline: "var(--space-2)", paddingBlock: "var(--space-1)" } as const;

// НЕ `import.meta.glob` — этот приём уже роняло витрину зоны один раз (`PWEB-126`, разбор
// «попытка import.meta.glob... провалена и откачена»): путь через кастомный алиас
// дев-сервера (`packages/build/src/workspace-source.ts`) резолвил такой импорт иначе, чем
// настоящий `vite build`, и `import.meta.glob` требует `vite/client` в `types` `tsconfig.json`
// сверх того. Проба здесь читает файловую систему НАПРЯМУЮ (`readdirSync`) и импортирует
// каждый найденный `recipe.ts` через `import(/* @vite-ignore */ …)` — полностью переменный путь
// в `import()` без глоба Vite статически не анализирует и падает ("Unknown variable dynamic
// import") без этой пометки; с ней это обычный рантайм-`import()`, тот же путь, каким модуль
// нашла бы `node`.
const SRC_DIR = fileURLToPath(new URL("../src/", import.meta.url));

const components = readdirSync(SRC_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(`${SRC_DIR}${name}/playground/recipe.ts`))
  .sort();

/** Обходит дерево рецепта и собирает КАЖДЫЙ `props`-объект — на любой глубине, любой части. */
function collectProps(node: unknown, hits: Record<string, unknown>[]): void {
  if (node === null || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) collectProps(item, hits);
    return;
  }

  const record = node as Record<string, unknown>;
  if (record["props"] !== undefined && typeof record["props"] === "object" && record["props"] !== null) {
    hits.push(record["props"] as Record<string, unknown>);
  }

  for (const value of Object.values(record)) collectProps(value, hits);
}

/** Вид части выводится из самих `props`, а не из её имени: имена у компонентов свои, а вид — общий.
 *  Кликабельная часть с вертикальной набивкой — строка списка (пункт меню, узел дерева, заголовок
 *  секции); часть со ступенью высоты и без вертикальной набивки — контрол. Нулевая набивка значит
 *  «набивку даёт родитель» (кнопка сортировки внутри ячейки) — такая часть не меряется ни тем, ни
 *  другим. */
function roleOf(declarations: Record<string, unknown>): "row" | "control" | undefined {
  const paddingBlock = (declarations["paddingBlock"] ?? declarations["padding"]) as string | undefined;
  const ownPadding = paddingBlock !== undefined && paddingBlock !== "0";

  if (declarations["cursor"] === "pointer" && ownPadding) return "row";

  const height = (declarations["minHeight"] ?? declarations["minBlockSize"]) as string | undefined;
  if (height !== undefined && CONTROL[height] !== undefined && !ownPadding) return "control";

  return undefined;
}

describe.each(components)("%s/playground/recipe.ts — вид части задаёт набивку и шрифт", (name) => {
  it("контрол несёт высоту, набивку и шрифт одной ступени; строка списка — общую набивку кита", async () => {
    const mod = (await import(/* @vite-ignore */ `../src/${name}/playground/recipe.js`)) as {
      recipe?: unknown;
    };
    if (mod.recipe === undefined) return; // не всякий playground держит recipe.ts ради SlotRecipe

    const hits: Record<string, unknown>[] = [];
    collectProps(mod.recipe, hits);

    for (const props of hits) {
      const role = roleOf(props);
      const paddingInline = props["paddingInline"] as string | undefined;

      if (role === "row") {
        const paddingBlock = (props["paddingBlock"] ?? props["padding"]) as string;
        if (paddingInline !== undefined) {
          expect(paddingInline, `строка списка требует paddingInline ${ROW.paddingInline}`).toBe(ROW.paddingInline);
        }
        expect(paddingBlock, `строка списка требует paddingBlock ${ROW.paddingBlock}`).toBe(ROW.paddingBlock);
        continue;
      }

      if (role === "control") {
        const height = (props["minHeight"] ?? props["minBlockSize"]) as string;
        const step = CONTROL[height] as { paddingInline: string; fontSize: string };
        const fontSize = props["fontSize"] as string | undefined;

        if (paddingInline !== undefined) {
          expect(paddingInline, `${height} требует paddingInline ${step.paddingInline}`).toBe(step.paddingInline);
        }
        if (fontSize !== undefined) {
          expect(fontSize, `${height} требует fontSize ${step.fontSize}`).toBe(step.fontSize);
        }
      }
    }
  });
});
