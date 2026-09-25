import { userStore } from "../model";

/** Единственный вход в сущность для экрана — разбор в `FAQ.md`. */
export function useUsers() {
  return {
    users: () => userStore.selectors.users(),
    selected: () => userStore.selectors.selected(),
    activeCount: () => userStore.selectors.activeCount(),
    select: (id: string | undefined) => userStore.actions.select(id),
    toggleActive: (id: string) => userStore.actions.toggleActive(id),
    hire: (name: string, role: string) => userStore.actions.hire(name, role),
    dismiss: (id: string) => userStore.actions.dismiss(id),
  };
}
