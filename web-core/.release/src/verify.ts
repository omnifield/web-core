import { done, failed, type Answer } from "@web-core/cli";
import { probeDelivery, type ProbeReport } from "@web-core/cli/probe";

import { shippedPackages, type Shipped } from "./workspace";

export interface VerifyRequest {
  readonly cwd: string;
  readonly registry?: string;
  readonly only?: string;
  readonly types: boolean;
}

export interface Verified {
  readonly checked: number;
  readonly failures: readonly { readonly name: string; readonly summary: string }[];
  readonly reports: readonly ProbeReport[];
}

export async function verifyDelivery(request: VerifyRequest): Promise<Answer<Verified>> {
  const listed = await shippedPackages(request.cwd);
  if (listed.outcome !== "done") return listed;

  const targets = request.only
    ? listed.data.filter((item) => item.name === request.only)
    : listed.data;

  if (targets.length === 0) {
    return failed(`пакет ${request.only} не публикуется из этого воркспейса`, {
      remedy: "сверьте имя со списком: `pnpm ls -r --depth -1 --json`",
      details: { shipped: listed.data.map((item) => item.name) },
    });
  }

  const reports: ProbeReport[] = [];
  const failures: { name: string; summary: string }[] = [];

  for (const target of targets) {
    const answer = await probe(target, request);
    if (answer.outcome === "failed") {
      failures.push({ name: target.name, summary: answer.summary });
      if (isReport(answer.details)) reports.push(answer.details);
      continue;
    }
    if (answer.outcome === "done") reports.push(answer.data);
  }

  if (failures.length > 0) {
    return failed(`поставка не прошла приёмку: ${failures.length} из ${targets.length}`, {
      remedy: "смотрите шаги в details — временный проект каждой пробы остаётся на диске",
      details: { checked: targets.length, failures, reports },
    });
  }

  return done(`поставка принята: ${targets.length} пакетов`, {
    checked: targets.length,
    failures,
    reports,
  });
}

function probe(target: Shipped, request: VerifyRequest) {
  return probeDelivery({
    name: target.name,
    version: target.version,
    types: request.types,
    ...(request.registry ? { registry: request.registry } : {}),
  });
}

function isReport(value: unknown): value is ProbeReport {
  return typeof value === "object" && value !== null && "steps" in value;
}
