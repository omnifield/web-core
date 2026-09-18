import { createMemo, type JSX } from "solid-js";

import { Box } from "../../../shared/ui";
import { endpointKey, groupEndpoints, type OpenapiEndpoint } from "../models";

export function Endpoints(props: {
  label?: string;
  endpoints: readonly OpenapiEndpoint[];
  onAddTag?: () => void;
  onRemove?: () => void;
  onAddEndpoint?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onRemoveEndpoint?: (endpoint: OpenapiEndpoint) => void;
  children?: (endpoint: OpenapiEndpoint) => JSX.Element;
}) {
  const groups = createMemo(() => groupEndpoints(props.endpoints));

  return (
    <Box
      label={props.label}
      onAddChild={props.onAddTag}
      onRemove={props.onRemove}
      items={groups()}
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
          items={group.endpoints}
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
