// Шаг «editions» девбокса: записать, какие редакции глобальных инструментов реально стоят.
// Объявленный инструмент, которого в машине нет, — отказ: записывать нечего, и знать об этом
// надо на создании контейнера, а не когда он понадобится в работе.

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [declaredJson, outPath] = process.argv.slice(2);
const declared = JSON.parse(declaredJson);

const ls = spawnSync("npm", ["ls", "-g", "--depth=0", "--json"], {
  encoding: "utf8",
});
const installed = JSON.parse(ls.stdout || "{}").dependencies ?? {};

const editions = {};
for (const name of Object.keys(declared)) {
  editions[name] = {
    declared: declared[name],
    version: installed[name]?.version ?? null,
  };
}

const lost = Object.keys(editions).filter((name) => !editions[name].version);
if (lost.length > 0) {
  process.stderr.write(
    `[devbox] Фиксация редакций: ${lost.join(", ")} объявлен табличкой, а в машине его нет — записывать нечего.\n`,
  );
  process.exit(1);
}

writeFileSync(outPath, JSON.stringify({ globalTools: editions }, null, 2) + "\n");
