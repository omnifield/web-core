import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

import { apiCatalogOf, type ApiCatalogState } from "../models";

export function useApiCatalogState(api: Accessor<string>): Accessor<ApiCatalogState> {
  const [state, setState] = createSignal<ApiCatalogState>(apiCatalogOf(api()).get());

  createEffect(() => {
    const store = apiCatalogOf(api());
    setState(store.get());

    const subscription = store.subscribe(setState);
    onCleanup(() => subscription.unsubscribe());
  });

  return state;
}
