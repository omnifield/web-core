import { ClientError } from "@web-core/query/graphql";

import { NOT_CONNECTED } from "./service";

export interface PresetsFailure {
  readonly reason: "refused" | "unreachable" | "unconnected";
  readonly message: string;
}

export function failureOf(error: unknown): PresetsFailure {
  if (error instanceof ClientError) {
    const said = error.response.errors?.map((one) => one.message).join("; ");
    return { reason: "refused", message: said === undefined || said === "" ? error.message : said };
  }

  const message = error instanceof Error ? error.message : String(error);

  return message === NOT_CONNECTED
    ? { reason: "unconnected", message }
    : { reason: "unreachable", message };
}
