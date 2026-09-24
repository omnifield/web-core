// Подпуть `./docs` — гейт на ДВЕ разные лжи, и обе не видны изнутри репозитория.
//
// Первая: порождённый модуль отстал от файла в папке компонента. Вторая: текст уехал в корневой
// вход и его платит каждый, кто открыл один компонент. Обе проверяются на настоящих артефактах —
// файлах с диска и собранном `dist`, — а не на том, что функция вызвана.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { DOCS, docsOf } from "../src/docs";
import { PASSPORTS } from "../src/passport";

const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(PACKAGE_DIR, "src");
const DIST_DIR = join(PACKAGE_DIR, "dist");

function componentFile(component: string, file: string): string {
  return readFileSync(join(SRC_DIR, component, file), "utf8");
}

/**
 * Строка подлиннее из документа — ею ищут текст в собранном куске. Берётся только та, что в
 * строковом литерале выглядит буквально: перевод строки, кавычка и слеш там уже экранированы.
 */
function longestPlainLine(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/["\\\t]/.test(line))
    .reduce((longest, line) => (line.length > longest.length ? line : longest), "");
}

describe("карта загрузчиков покрывает кит целиком", () => {
  it("ключи те же, что у PASSPORTS — имя папки не разъехалось с `data-scope`", () => {
    expect(Object.keys(DOCS).sort()).toEqual(Object.keys(PASSPORTS).sort());
  });

  it("неизвестный компонент — `undefined`, а не пустая запись", () => {
    expect(docsOf("нет-такого")).toBeUndefined();
  });
});

describe("загрузчик отдаёт текст файла, а не пересказ", () => {
  it("компонент со всеми четырьмя документами отдаёт все четыре, слово в слово", async () => {
    const docs = await docsOf("accordion");

    expect(docs?.readme).toBe(componentFile("accordion", "README.md"));
    expect(docs?.faq).toBe(componentFile("accordion", "FAQ.md"));
    expect(docs?.examples).toBe(componentFile("accordion", "EXAMPLES.md"));
    expect(docs?.roadmap).toBe(componentFile("accordion", "ROADMAP.yaml"));
  });

  it("чего у компонента нет, того нет и в записи — молчаливой заглушки не появляется", async () => {
    const docs = await docsOf("tabs");

    expect(docs?.readme).toBe(componentFile("tabs", "README.md"));
    expect(docs?.examples).toBe(componentFile("tabs", "EXAMPLES.md"));
    expect(existsSync(join(SRC_DIR, "tabs", "FAQ.md"))).toBe(false);
    expect(docs?.faq).toBeUndefined();
    expect(docs?.roadmap).toBeUndefined();
  });

  it("`ROADMAP.yaml` доезжает текстом как есть — разбор ямла подпуть не делает", async () => {
    const docs = await docsOf("button");

    expect(docs?.roadmap).toBe(componentFile("button", "ROADMAP.yaml"));
    expect(typeof docs?.roadmap).toBe("string");
  });
});

describe("манифест объявляет подпуть обеими картами", () => {
  const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")) as {
    exports: Record<string, Record<string, string>>;
    publishConfig: { exports: Record<string, Record<string, string>> };
    files: string[];
  };

  // `publishConfig.exports` ЗАМЕНЯЕТ `exports` при публикации: подпуть, объявленный только в
  // первой карте, у потребителя из реестра не существует вовсе.
  it.each(["exports", "publishConfig.exports"])("`./docs` есть в `%s`", (field) => {
    const map = field === "exports" ? manifest.exports : manifest.publishConfig.exports;
    expect(map["./docs"]).toMatchObject({ types: "./dist/docs.d.ts", default: "./dist/docs.js" });
  });

  it("цель подпутя лежит в `dist` — то есть попадает в поставку по `files`", () => {
    expect(manifest.files).toContain("dist");
  });
});

describe("собранный подпуть грузит прозу по требованию", () => {
  // Гоняется ПОСЛЕ сборки: `nx` держит `test.dependsOn: ["build"]` (`package.json`).
  const built = existsSync(DIST_DIR) ? readdirSync(DIST_DIR).filter((name) => name.endsWith(".js")) : [];
  const entry = join(DIST_DIR, "docs.js");
  const needle = longestPlainLine(componentFile("button", "README.md"));

  it("вход подпутя собран", () => {
    expect(existsSync(entry)).toBe(true);
  });

  it("искомая строка достаточно приметная, чтобы поиск что-то значил", () => {
    expect(needle.length).toBeGreaterThan(40);
  });

  it("текст компонента лежит НЕ во входе подпутя", () => {
    expect(readFileSync(entry, "utf8")).not.toContain(needle);
  });

  it("а в отдельном куске рядом — он реально уезжает в поставку", () => {
    const carrying = built.filter((name) => readFileSync(join(DIST_DIR, name), "utf8").includes(needle));

    expect(carrying).toHaveLength(1);
    expect(carrying[0]).not.toBe("docs.js");
  });
});
