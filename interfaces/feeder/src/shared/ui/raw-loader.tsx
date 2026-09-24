import { layoutGroup, layoutSelf } from "@web-core/skin";
import {
  Button,
  Field,
  FieldTextarea,
  FileUpload,
  FileUploadTrigger,
  Flow,
  FlowItem,
  Typography,
} from "@web-core/ui";
import { createSignal, Show } from "@web-core/solid";

export function RawLoader(props: {
  label: string;
  onLoad: (raw: string) => void;
  accept?: string;
  onPick?: (fileName: string) => void;
  disabled?: boolean;
}) {
  const [raw, setRaw] = createSignal("");
  const [picked, setPicked] = createSignal<string>();
  const [failure, setFailure] = createSignal<string>();

  async function read(file: File) {
    setFailure(undefined);
    try {
      setRaw(await file.text());
      setPicked(file.name);
      props.onPick?.(file.name);
    } catch (error) {
      setPicked(undefined);
      setFailure(error instanceof Error ? error.message : String(error));
    }
  }

  function load() {
    const text = raw().trim();
    if (text === "") return;
    props.onLoad(text);
  }

  return (
    <Flow data-variant="column">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Flow
          style={layoutGroup({ align: "center", gap: "space-2", wrap: false })}
        >
          <FileUpload
            style={layoutSelf({ shrink: false })}
            accept={props.accept}
            maxFiles={1}
            onFileAccept={(details) => {
              const file = details.files[0];
              if (file !== undefined) void read(file);
            }}
          >
            <FileUploadTrigger>Выбрать файл</FileUploadTrigger>
          </FileUpload>

          <Field
            style={{
              ...layoutSelf({ grow: true, shrink: true }),
              "min-width": "0",
            }}
          >
            <FieldTextarea
              rows={1}
              style={{
                "text-align": "center",

                padding: "6px",
                "min-width": "0",
                width: "100%",
                resize: "none",
                "min-block-size": "34px",
                "max-height": "34px",
              }}
              placeholder="PASTE"
              value={raw()}
              onInput={(event) => setRaw(event.currentTarget.value)}
            />
          </Field>
        </Flow>
      </FlowItem>

      <Show when={picked()}>
        {(name) => (
          <FlowItem>
            <Typography>{name()}</Typography>
          </FlowItem>
        )}
      </Show>

      <Show when={failure()}>
        {(message) => (
          <FlowItem>
            <Typography>Файл не прочитался: {message()}</Typography>
          </FlowItem>
        )}
      </Show>

      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button
          style={{ width: "100%" }}
          disabled={raw().trim() === "" || props.disabled === true}
          onClick={load}
        >
          {props.label}
        </Button>
      </FlowItem>
    </Flow>
  );
}
