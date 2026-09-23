import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { InstalledPackage } from "./contract";

interface Manifest {
  readonly version?: string;
  readonly dependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  readonly exports?: unknown;
}

export async function readInstalled(projectDir: string): Promise<InstalledPackage | undefined> {
  const project = await manifestAt(join(projectDir, "package.json"));
  const name = Object.keys(project.dependencies ?? {}).find((key) => key !== "typescript");
  if (!name) return undefined;

  const manifest = await manifestAt(join(projectDir, "node_modules", ...name.split("/"), "package.json"));
  const meta = manifest.peerDependenciesMeta ?? {};

  return {
    name,
    version: manifest.version ?? "неизвестна",
    dependencies: manifest.dependencies ?? {},
    peerDependencies: manifest.peerDependencies ?? {},
    optionalPeers: Object.keys(meta).filter((key) => meta[key]?.optional === true),
    entries: entriesOf(name, manifest.exports),
  };
}

/** Спеки для установщика; `workspace:` в поставке не разворачивается — берём такой peer без диапазона. */
export function peerSpecs(installed: InstalledPackage): readonly string[] {
  return Object.entries(installed.peerDependencies).map(([name, range]) =>
    range.startsWith("workspace:") || range === "*" ? name : `${name}@${range}`,
  );
}

function entriesOf(name: string, exported: unknown): readonly string[] {
  if (typeof exported !== "object" || exported === null) return [name];

  const subpaths = Object.keys(exported).filter((key) => key.startsWith(".") && !key.includes("*"));
  if (subpaths.length === 0) return [name];

  return subpaths.map((subpath) => (subpath === "." ? name : `${name}/${subpath.slice(2)}`));
}

async function manifestAt(path: string): Promise<Manifest> {
  return JSON.parse(await readFile(path, "utf8")) as Manifest;
}
