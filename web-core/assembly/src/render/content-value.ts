// см. README.md / FAQ.md

import {
  isContent,
  isDataBinding,
  isReference,
  resolveDataBinding,
  type AssemblyNode,
} from "../engine/tree.js";

/** Значение content-узла (`genus:"text"|"icon"`) как строка — литерал как есть, `{path}`
 * резолвится по данным показа. Не-content узел или узел без данных — пустая строка. */
export function valueOf(current: AssemblyNode | undefined, data: unknown): string {
  if (!current || !isContent(current)) return "";

  const value = current.value;
  if (!isDataBinding(value)) return value;

  const resolved = resolveDataBinding(data, value.path);
  return typeof resolved === "string" ? resolved : (resolved?.toString() ?? "");
}

/** Имя для диагностики (граница ошибок, `DefaultFallback`) — тип части, `содержимое:<род>` либо
 * `модуль:<имя>`. */
export function typeOrGenus(current: AssemblyNode | undefined): string {
  if (!current) return "неизвестен";
  if (isContent(current)) return `содержимое:${current.genus}`;
  if (isReference(current)) return `модуль:${current.module}`;
  return current.type;
}
