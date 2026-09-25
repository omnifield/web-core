import { createActionStore } from "@web-core/store";

export interface User {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly active: boolean;
}

interface UserState {
  readonly users: readonly User[];
  readonly selectedId: string | undefined;
}

const initial: UserState = {
  users: [
    { id: "ada", name: "Ада Лавлейс", role: "аналитик", active: true },
    { id: "alan", name: "Алан Тьюринг", role: "инженер", active: true },
    { id: "grace", name: "Грейс Хоппер", role: "архитектор", active: false },
    { id: "linus", name: "Линус Торвальдс", role: "инженер", active: true },
  ],
  selectedId: undefined,
};

export const userStore = createActionStore<
  UserState,
  {
    select(id: string | undefined): void;
    toggleActive(id: string): void;
    hire(name: string, role: string): void;
    dismiss(id: string): void;
  },
  {
    users(state: UserState): readonly User[];
    selected(state: UserState): User | undefined;
    activeCount(state: UserState): number;
  }
>(
  initial,
  ({ setState }) => ({
    select(id) {
      setState((state) => ({ ...state, selectedId: id }));
    },
    toggleActive(id) {
      setState((state) => ({
        ...state,
        users: state.users.map((user) =>
          user.id === id ? { ...user, active: !user.active } : user,
        ),
      }));
    },
    hire(name, role) {
      setState((state) => ({
        ...state,
        users: [
          ...state.users,
          { id: `user-${state.users.length + 1}`, name, role, active: true },
        ],
      }));
    },
    dismiss(id) {
      setState((state) => ({
        ...state,
        users: state.users.filter((user) => user.id !== id),
        selectedId: state.selectedId === id ? undefined : state.selectedId,
      }));
    },
  }),
  () => ({
    users(state) {
      return state.users;
    },
    selected(state) {
      return state.users.find((user) => user.id === state.selectedId);
    },
    activeCount(state) {
      return state.users.filter((user) => user.active).length;
    },
  }),
);
