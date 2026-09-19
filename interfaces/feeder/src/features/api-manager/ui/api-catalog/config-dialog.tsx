import { createEffect } from "@web-core/solid";
import { Dialog, DialogContent } from "@web-core/ui";

import type {
  EndpointDescriptor,
  EndpointGroup,
  SchemaDocument,
} from "../../../../entities/openapi";

export function ConfigDialog(props: {
  item?: SchemaDocument | EndpointGroup | EndpointDescriptor;
  onClose: () => void;
}) {
  createEffect(() => {
    console.log("config-dialog: узел", props.item);
  });

  return (
    <Dialog
      open={props.item !== undefined}
      onOpenChange={(details) => {
        if (!details.open) props.onClose();
      }}
    >
      <DialogContent />
    </Dialog>
  );
}
