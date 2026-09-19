import type { Accessor, JSX } from "@web-core/solid";

import { Box } from "../../../shared/ui";
import {
  groupEndpoints,
  type ConfigTarget,
  type EndpointDescriptor,
  type EndpointGroup,
  type SchemaDocument,
} from "../models";

export function Endpoints(props: {
  label?: string;
  document: SchemaDocument;
  onAddGroup?: () => void;
  onRemove?: () => void;
  onAddEndpoint?: (group: EndpointGroup) => void;
  onConfig?: (target: ConfigTarget) => void;
  onRemoveGroup?: (group: EndpointGroup) => void;
  onRemoveEndpoint?: (endpoint: EndpointDescriptor) => void;
  children?: (endpoint: Accessor<EndpointDescriptor>) => JSX.Element;
}) {
  return (
    <Box
      label={props.label}
      onConfig={
        props.onConfig === undefined
          ? undefined
          : (group) =>
              props.onConfig?.(
                group === undefined
                  ? { kind: "schema", item: props.document }
                  : { kind: "group", item: group },
              )
      }
      onAddChild={props.onAddGroup}
      onRemove={props.onRemove}
      items={groupEndpoints(props.document)}
      itemKey={(group) => group.id}
      itemLabel={(group) => group.name}
      onItemAddChild={
        props.onAddEndpoint === undefined
          ? undefined
          : (group) => props.onAddEndpoint?.(group)
      }
      onItemRemove={
        props.onRemoveGroup === undefined
          ? undefined
          : (group) => props.onRemoveGroup?.(group)
      }
    >
      {(group) => (
        <Box
          items={group().endpoints}
          itemKey={(endpoint) => endpoint.id}
          itemLabel={(endpoint) => `${endpoint.method}`}
          onConfig={
            props.onConfig === undefined
              ? undefined
              : (endpoint) =>
                  props.onConfig?.(
                    endpoint === undefined
                      ? { kind: "schema", item: props.document }
                      : { kind: "endpoint", item: endpoint },
                  )
          }
          onItemRemove={props.onRemoveEndpoint}
        >
          {(endpoint) => props.children?.(endpoint)}
        </Box>
      )}
    </Box>
  );
}
