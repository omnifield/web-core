// Шаг «plot» девбокса: записать, на какой редакции базового образа собран этот контейнер.
// Разбор, зачем это нужно, — в комментарии к onCreateCommand (`.devcontainer/devcontainer.json`).

import { readFileSync, writeFileSync } from "node:fs";

const [declared, metaPath, outPath] = process.argv.slice(2);

function metaOf(path) {
  let text = "";
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return {};
  }

  const meta = {};
  for (const line of text.split("\n")) {
    const at = line.indexOf("=");
    if (at > 0) {
      const key = line.slice(0, at).trim();
      meta[key] = line
        .slice(at + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return meta;
}

const meta = metaOf(metaPath);
const edition = { declared };

if (meta.VERSION) {
  edition.state = "marked";
  edition.release = meta.VERSION;
  if (meta.DEFINITION_ID) edition.definition = meta.DEFINITION_ID;
  if (meta.VARIANT) edition.variant = meta.VARIANT;
} else {
  edition.state = "unmarked";
}

writeFileSync(outPath, JSON.stringify({ plotEdition: edition }, null, 2) + "\n");
