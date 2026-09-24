import type { TreeItemData } from "@web-core/ui";

/** Моки: своего склада у модулей пока нет. */
const SAVED: readonly TreeItemData[] = [
  { value: "login-form", label: "Форма входа" },
  { value: "user-card", label: "Карточка пользователя" },
  { value: "orders-board", label: "Доска заказов" },
];

export function modulesTree(): readonly TreeItemData[] {
  return SAVED;
}
