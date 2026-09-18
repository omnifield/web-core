import { HTTPError, rawRestRequest } from "@web-core/query/rest";

import {
  appendQuery,
  resolveUrl,
  toResult,
  type InvokeResult,
  type OpenapiEndpoint,
} from "../../../entities/openapi";

function paramsOf(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export async function invokeEndpoint(
  endpoint: OpenapiEndpoint,
  value: unknown,
): Promise<InvokeResult> {
  const params = paramsOf(value);
  const { body, ...rest } = params;
  const { url, query } = resolveUrl(endpoint.url, rest);

  try {
    const { response, data } = await rawRestRequest(appendQuery(url, query), {
      method: endpoint.method,
      ...(body === undefined ? {} : { json: body }),
    });
    return toResult(response, data);
  } catch (error) {
    if (error instanceof HTTPError) return toResult(error.response, error.data);
    throw error;
  }
}
