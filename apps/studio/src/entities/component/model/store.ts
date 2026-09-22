import { createActionStoreFamily } from "@web-core/store";
import {
  type ComponentDescriptor,
  componentDescriptorOf,
} from "@web-core/ui/component-info";

/** Ячейка-заглушка: активного компонента нет. */
const NO_COMPONENT: ComponentDescriptor = {
  component: "",
  passport: undefined,
  editorInfo: undefined,
  io: undefined,
};

/**
 * Ячейка на компонент: срез кита собирается при её рождении, из её же ключа.
 *
 * Ходят к активной (`componentStoreOf.active()`) — её называет маршрут; по имени адресуют только
 * того, кто нужен явно.
 */
export const componentStoreOf = createActionStoreFamily<
  ComponentDescriptor,
  Record<string, never>,
  {
    name(state: ComponentDescriptor): string;
    passport(state: ComponentDescriptor): ComponentDescriptor["passport"];
    editorInfo(state: ComponentDescriptor): ComponentDescriptor["editorInfo"];
    io(state: ComponentDescriptor): ComponentDescriptor["io"];
  }
>(
  (component) => componentDescriptorOf(component),
  () => ({}),
  () => ({
    name(state) {
      return state.component;
    },
    passport(state) {
      return state.passport;
    },
    editorInfo(state) {
      return state.editorInfo;
    },
    io(state) {
      return state.io;
    },
  }),
  { empty: NO_COMPONENT },
);
