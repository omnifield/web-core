import { createSignal, type Accessor } from "@web-core/solid";

import type { InvokeResult, OpenapiEndpoint } from "../../../entities/openapi";
import { invokeEndpoint } from "./invoke";
import { serve, type Serving, type Users } from "./serve";

export interface Invocation {
  readonly call: (value: unknown) => Promise<void>;
  readonly result: Accessor<InvokeResult | undefined>;
  readonly serving: Accessor<Serving | undefined>;
  readonly failure: Accessor<string | undefined>;
  readonly pending: Accessor<boolean>;
}

export function useInvoke(
  endpoint: Accessor<OpenapiEndpoint>,
  users?: Accessor<Users | undefined>,
): Invocation {
  const [result, setResult] = createSignal<InvokeResult>();
  const [serving, setServing] = createSignal<Serving>();
  const [failure, setFailure] = createSignal<string>();
  const [pending, setPending] = createSignal(false);

  async function call(value: unknown) {
    setPending(true);
    setFailure(undefined);

    const fed = users?.();

    try {
      if (fed === undefined) {
        setServing(undefined);
        setResult(await invokeEndpoint(endpoint(), value));
        return;
      }

      const shot = await serve(endpoint(), value, fed);

      setServing(shot);
      setResult(shot.result);
    } catch (error) {
      setResult(undefined);
      setServing(undefined);
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }

  return { call, result, serving, failure, pending };
}
