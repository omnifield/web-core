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

/**
 * Дёрнуть ОДНУ настроенную ручку. Значение — то же, что редактировали деревом: имена параметров
 * плюс необязательный `body`; путь/квери разводит `resolveUrl` по `{плейсхолдерам}` шаблона.
 *
 * Не-2xx — ВАЛИДНЫЙ результат, а не исключение: инструмент постмановского рода показывает 404
 * и 500 так же, как 200 — со статусом, заголовками и телом. `rawRestRequest` на таком ответе
 * кидает `HTTPError`, но несёт в нём и `response`, и разобранное тело, поэтому разворачиваем
 * обратно в тот же `InvokeResult`, что и на успехе.
 *
 * А вот сорванный транспорт (сети нет, CORS, кривой url) исключением и остаётся: ответа не было
 * вообще, и притворяться, что был, — врать вызывающему. Показать это — работа UI, не движка.
 */
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
