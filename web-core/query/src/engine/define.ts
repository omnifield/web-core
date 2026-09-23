import { createQuery } from "@tanstack/solid-query";
import type { QueryClient, QueryExecuteOptions, QueryKey, QueryOptions } from "@tanstack/solid-query";
import type { Accessor } from "solid-js";

// Почему `initialData` не пробрасывается — FAQ.md, раздел defineQuery.
type DefineOptions<TData> = Omit<QueryExecuteOptions<TData>, "queryKey" | "queryFn" | "initialData">;
type UseOptions<TData> = Omit<QueryOptions<TData>, "queryKey" | "queryFn" | "initialData">;

export function defineQuery<TData, TArg = void>(
  queryClient: QueryClient,
  queryKey: (arg: TArg) => QueryKey,
  queryFn: (arg: TArg) => Promise<TData>,
  config?: DefineOptions<TData>,
) {
  const options = (arg?: TArg) => ({
    queryKey: queryKey(arg as TArg),
    queryFn: () => queryFn(arg as TArg),
    ...config,
  });

  function query(arg?: TArg): Promise<TData> {
    return queryClient.query<TData>(options(arg));
  }
  query.use = (arg?: Accessor<TArg>, use?: Accessor<UseOptions<TData>>) =>
    createQuery(() => ({ ...options(arg?.()), ...use?.() }));

  return query;
}
