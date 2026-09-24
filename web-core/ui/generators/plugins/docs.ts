// Документы компонентов — в модули поставки, тем же обходом папок, что барели (`kitBarrelPlugins`).
// Почему подпутём и почему загрузчиками, а не одним объектом — `FAQ.md` зоны.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { fromEntryTemplate, fromTemplate } from "@web-core/generators/engine";
import type { AggregatePlugin, GeneratorPlugin, PerEntryPlugin } from "@web-core/generators/engine";

export interface KitDocsOptions {
  readonly outputDir: string;
  readonly templatesDir: string;
}

/** Файл в папке компонента — имя, которым его текст уезжает в модуль. */
const DOCUMENTS = [
  { id: "readme", file: "README.md" },
  { id: "faq", file: "FAQ.md" },
  { id: "examples", file: "EXAMPLES.md" },
  { id: "roadmap", file: "ROADMAP.yaml" },
] as const;

interface DocumentItem {
  readonly id: string;
  readonly literal: string;
}

interface ComponentDocsItem {
  readonly name: string;
  readonly documents: readonly DocumentItem[];
}

function modulesDirOf(options: KitDocsOptions): string {
  return join(options.outputDir, "docs");
}

function textPlugin(options: KitDocsOptions): PerEntryPlugin<ComponentDocsItem> {
  const modulesDir = modulesDirOf(options);
  return {
    name: "kit:docs-text",
    // Папка порождённая и под `.gitignore` — на чистом дереве её нет вовсе, а запись каталогов не создаёт.
    setup: () => void mkdirSync(modulesDir, { recursive: true }),
    outputFor: (entry) => join(modulesDir, `${entry.name}.ts`),
    collect: (entry) => ({
      name: entry.name,
      documents: DOCUMENTS.filter((document) => entry.has(document.file)).map((document) => ({
        id: document.id,
        literal: JSON.stringify(entry.read(document.file)),
      })),
    }),
    render: fromEntryTemplate(join(options.templatesDir, "component.ts.hbs")),
  };
}

function mapPlugin(options: KitDocsOptions): AggregatePlugin<{ name: string }> {
  return {
    name: "kit:docs",
    output: join(options.outputDir, "docs.ts"),
    collect: (entries) => entries.map((entry) => ({ name: entry.name })),
    render: fromTemplate(join(options.templatesDir, "docs.ts.hbs")),
  };
}

export function kitDocsPlugins(options: KitDocsOptions): readonly GeneratorPlugin[] {
  return [textPlugin(options), mapPlugin(options)];
}
