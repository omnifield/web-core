import { done, failed, type Answer } from "@web-core/cli";

import { run } from "./run";

export interface Shipped {
  readonly name: string;
  readonly version: string;
}

interface Listed {
  readonly name?: string;
  readonly version?: string;
  readonly private?: boolean;
}

export async function shippedPackages(cwd: string): Promise<Answer<readonly Shipped[]>> {
  const ran = await run("pnpm", ["ls", "-r", "--depth", "-1", "--json"], cwd);

  if (!ran.ok) {
    return failed("список пакетов воркспейса не прочитался", {
      remedy: "прогоните `pnpm ls -r --depth -1 --json` руками",
      details: { stderr: ran.stderr.trim() },
    });
  }

  let listed: readonly Listed[];
  try {
    listed = JSON.parse(ran.stdout) as readonly Listed[];
  } catch (error) {
    return failed("список пакетов не разобрался", {
      remedy: "формат вывода pnpm изменился — сверьте разбор в `.release/src/workspace.ts`",
      details: { error: String(error) },
    });
  }

  const shipped = listed
    .filter((item): item is Listed & Shipped => !item.private && Boolean(item.name) && Boolean(item.version))
    .map(({ name, version }) => ({ name, version }));

  return done(`публикуемых пакетов: ${shipped.length}`, shipped);
}
