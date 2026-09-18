import {
  Button,
  Field,
  FieldLabel,
  FieldTextarea,
  FileUpload,
  FileUploadTrigger,
  Flow,
  Surface,
  Typography,
} from "@web-core/ui";
import { createSignal, Show } from "solid-js";

/**
 * «Закинуть апиху» — два способа донести ОДИН и тот же документ: выбрать файл или вставить текст.
 *
 * Файл не уходит наружу отдельным путём, а наполняет ту же текстовую область: после выбора видно,
 * что именно сейчас загрузится, и это можно поправить до нажатия. Иначе у нас было бы два разных
 * входа с разным поведением, и «почему схема не та» пришлось бы выяснять вслепую.
 *
 * Наружу отдаём СЫРОЙ текст: распознавание — дело каталога ручек (`loadSchema`), здесь только
 * способ донести документ.
 */
export function SchemaSource(props: { onLoad: (raw: string) => void }) {
  const [text, setText] = createSignal("");
  const [picked, setPicked] = createSignal<string>();
  const [failure, setFailure] = createSignal<string>();

  async function read(file: File) {
    setFailure(undefined);
    try {
      setText(await file.text());
      setPicked(file.name);
    } catch (error) {
      setPicked(undefined);
      setFailure(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <Surface>
      <Typography>Схема</Typography>

      <Flow>
        <FileUpload
          accept=".json,.yaml,.yml,.txt"
          maxFiles={1}
          onFileAccept={(details) => {
            const file = details.files[0];
            if (file !== undefined) void read(file);
          }}
        >
          <FileUploadTrigger>Выбрать файл</FileUploadTrigger>
        </FileUpload>
        <Show when={picked()}>{(name) => <Typography>{name()}</Typography>}</Show>
        <Show when={failure()}>
          {(message) => <Typography>Файл не прочитался: {message()}</Typography>}
        </Show>
      </Flow>

      <Field>
        <FieldLabel>Документ (Swagger 2.0, JSON или YAML)</FieldLabel>
        <FieldTextarea
          rows={8}
          placeholder="swagger: '2.0' …"
          value={text()}
          onInput={(event) => setText(event.currentTarget.value)}
        />
      </Field>

      <Button disabled={text().trim() === ""} onClick={() => props.onLoad(text())}>
        Загрузить схему
      </Button>
    </Surface>
  );
}
