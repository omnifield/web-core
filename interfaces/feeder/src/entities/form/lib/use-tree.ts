import { createMemo } from "@web-core/solid";
import {
  blankElement,
  fieldsOfElement,
  type FieldDescriptor,
} from "@web-core/generators/fields";

import type { FieldBinding } from "./binding";

export function useTree(field: FieldDescriptor, binding: FieldBinding) {
  const elementFields = field.element ? fieldsOfElement(field.element) : [];
  const items = createMemo(() =>
    Array.isArray(binding.value()) ? (binding.value() as unknown[]) : [],
  );
  const indices = createMemo(() => items().map((_, index) => index));

  function add() {
    if (!field.element) return;
    binding.onChange([blankElement(field.element), ...items()]);
  }

  function removeAt(index: number) {
    binding.onChange(items().filter((_, current) => current !== index));
  }

  return { elementFields, items, indices, add, removeAt };
}
