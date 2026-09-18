// Публичный вход пакета. Наружу — то, чем пользуется приложение: экран настройки API с
// привязками, витрина (`useFeed`), отдельные кирпичи для нестандартной сборки и типы, которые
// приложение обязано уметь назвать (потребитель, привязка).

export { TreeForm } from "./features/tree-form";
export { ApiList, ApiManagerProvider, useApiCatalog, useApiId } from "./features/api-manager";
export { invokeEndpoint } from "./features/invoke-endpoint";

export { BindEndpoint, BindingEditor } from "./widgets/binding";
export { Mapping, type MappingChange } from "./widgets/mapping";
export { feedBindingOf, feedOf, useFeed } from "./widgets/feed";

export {
  applyBinding,
  bindingBy,
  bindingKey,
  bindingStoreOf,
  isFed,
  noFeed,
  type Binding,
  type BindingsState,
  type BindingSource,
  type Consumer,
} from "./entities/binding";
export {
  apiCatalogOf,
  endpointBy,
  endpointKey,
  type ApiCatalogState,
  type ApiStatus,
  type EndpointDescriptor,
  type EndpointParam,
  type HttpMethod,
  type InvokeResult,
  type OpenapiEndpoint,
} from "./entities/openapi";
