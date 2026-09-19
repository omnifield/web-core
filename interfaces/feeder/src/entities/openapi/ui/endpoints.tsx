import type { Accessor, JSX } from "@web-core/solid";

import { Box } from "../../../shared/ui";
import { endpointKey, groupEndpoints, type EndpointDescriptor } from "../models";

export function Endpoints(props: {
  label?: string;
  endpoints: readonly EndpointDescriptor[];
  onAddTag?: () => void;
  onRemove?: () => void;
  onAddEndpoint?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onRemoveEndpoint?: (endpoint: EndpointDescriptor) => void;
  children?: (endpoint: Accessor<EndpointDescriptor>) => JSX.Element;
}) {
  return (
    <Box
      label={props.label}
      onAddChild={props.onAddTag}
      onRemove={props.onRemove}
      items={groupEndpoints(props.endpoints)}
      itemKey={(group) => group.tag}
      itemLabel={(group) => group.tag}
      onItemAddChild={
        props.onAddEndpoint === undefined
          ? undefined
          : (group) => props.onAddEndpoint?.(group.tag)
      }
      onItemRemove={
        props.onRemoveTag === undefined
          ? undefined
          : (group) => props.onRemoveTag?.(group.tag)
      }
    >
      {(group) => (
        <Box
          items={group().endpoints}
          itemKey={endpointKey}
          itemLabel={(endpoint) => `${endpoint.method} ${endpoint.url}`}
          onItemRemove={props.onRemoveEndpoint}
        >
          {(endpoint) => props.children?.(endpoint)}
        </Box>
      )}
    </Box>
  );
}
