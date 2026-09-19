import { createSignal, type Accessor } from "@web-core/solid";

import type { InvokeResult, OpenapiEndpoint } from "../../../entities/openapi";
import { invokeEndpoint } from "./invoke";

export interface Invocation {
  readonly call: (value: unknown) => Promise<void>;
  readonly result: Accessor<InvokeResult | undefined>;
  readonly failure: Accessor<string | undefined>;
  readonly pending: Accessor<boolean>;
}

export function useInvoke(endpoint: Accessor<OpenapiEndpoint>): Invocation {
  const [result, setResult] = createSignal<InvokeResult>();
  const [failure, setFailure] = createSignal<string>();
  const [pending, setPending] = createSignal(false);

  async function call(value: unknown) {
    setPending(true);
    setFailure(undefined);

    try {
      setResult(await invokeEndpoint(endpoint(), value));
    } catch (error) {
      setResult(undefined);
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }

  return { call, result, failure, pending };
}
