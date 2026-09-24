import { createSignal } from "@web-core/solid";

export function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button type="button" data-testid="counter" onClick={() => setCount(count() + 1)}>
      {count()}
    </button>
  );
}
