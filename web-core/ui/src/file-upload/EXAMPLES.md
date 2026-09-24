# 🧪 Примеры — как работать с `FileUpload`

Рабочий код для локального теста, не канон. Анатомия, состояния и рецепт — [`README.md`](./README.md).
Здесь — то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

> [!NOTE]
> У компонента нет своих `FAQ.md`/`ROADMAP.yaml` — разборы и план по нему живут в доке зоны
> (`web-core/ui/FAQ.md`, `web-core/ui/ROADMAP.yaml`).

## 1. Ручная сборка — выбор файлов со списком

Самый простой путь: JSX-композиция, без схемы и движка. Скрытый `<input type="file">` класть не
нужно — его кладёт сам корень.

```tsx
import { createSignal, For } from "@web-core/solid";
import {
  FileUpload,
  FileUploadItem,
  FileUploadItemDeleteTrigger,
  FileUploadItemGroup,
  FileUploadItemName,
  FileUploadItemSizeText,
  FileUploadLabel,
  FileUploadTrigger,
} from "@web-core/ui";

export function BasicFileUploadDemo() {
  const [files, setFiles] = createSignal<File[]>([]);

  return (
    <FileUpload
      data-variant="xxx"
      maxFiles={5}
      acceptedFiles={files()}
      onFileChange={(details) => setFiles(details.acceptedFiles)}
    >
      <FileUploadLabel>Вложения</FileUploadLabel>
      <FileUploadTrigger>Выбрать файлы</FileUploadTrigger>

      <FileUploadItemGroup type="accepted">
        <For each={files()}>
          {(file) => (
            <FileUploadItem file={file}>
              <FileUploadItemName />
              <FileUploadItemSizeText />
              <FileUploadItemDeleteTrigger>✕</FileUploadItemDeleteTrigger>
            </FileUploadItem>
          )}
        </For>
      </FileUploadItemGroup>
    </FileUpload>
  );
}
```

Полезно проверить: `item` ждёт НАСТОЯЩИЙ `File`, а не описание файла объектом — той же категории,
что коллекция у селекта или значение даты у календаря. Имя и размер рисуют сами части, форматировать
их руками не нужно.

## 2. Зона сброса плюс кнопка — без двойного открытия

Клик по зоне сброса сам открывает выбор файлов. Если внутрь кладётся ещё и кнопка, собственный клик
зоны гасится, иначе пикер откроется дважды.

```tsx
import { FileUpload, FileUploadDropzone, FileUploadLabel, FileUploadTrigger } from "@web-core/ui";

export function DropzoneFileUploadDemo() {
  return (
    <FileUpload data-variant="xxx">
      <FileUploadLabel>Документы</FileUploadLabel>

      <FileUploadDropzone disableClick>
        Перетащите файлы сюда
        <FileUploadTrigger>или выберите вручную</FileUploadTrigger>
      </FileUploadDropzone>
    </FileUpload>
  );
}
```

Полезно проверить: пока файл тащат над виджетом, `[data-dragging]` появляется на корне И на зоне
сброса — только эти двое видят перетаскивание физически, остальные части о нём не знают.
Drag-and-drop работает нативно, своего кода на это писать не нужно.

## 3. Ограничения и отклонённые файлы

Тип и размер ограничиваются пропами корня; не прошедшие проверку файлы не пропадают молча, а
попадают во ВТОРУЮ группу.

```tsx
import { createSignal, For } from "@web-core/solid";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemGroup,
  FileUploadItemName,
  FileUploadLabel,
} from "@web-core/ui";

export function LimitsFileUploadDemo() {
  const [accepted, setAccepted] = createSignal<File[]>([]);
  const [rejected, setRejected] = createSignal<File[]>([]);

  return (
    <FileUpload
      data-variant="xxx"
      accept="image/png,image/jpeg"
      maxFileSize={1024 * 1024}
      acceptedFiles={accepted()}
      onFileAccept={(details) => setAccepted(details.files)}
      onFileReject={(details) => setRejected(details.files.map((entry) => entry.file))}
    >
      <FileUploadLabel>Изображения — PNG/JPEG, до 1 МБ</FileUploadLabel>
      <FileUploadDropzone>Перетащите сюда</FileUploadDropzone>

      <FileUploadItemGroup type="accepted">
        <For each={accepted()}>
          {(file) => (
            <FileUploadItem file={file}>
              <FileUploadItemName />
            </FileUploadItem>
          )}
        </For>
      </FileUploadItemGroup>

      <FileUploadItemGroup type="rejected">
        <For each={rejected()}>
          {(file) => (
            <FileUploadItem file={file}>
              <FileUploadItemName />
            </FileUploadItem>
          )}
        </For>
      </FileUploadItemGroup>
    </FileUpload>
  );
}
```

Полезно проверить: части внутри строки файла несут `[data-type="accepted"]` или
`[data-type="rejected"]` — но берут его с ЗАКРЫВАЮЩЕЙ группы, а не с себя. Поэтому списки и
заводятся раздельно: проп `type` у самой строки не существует.

## 4. Превью по типу файла

`itemPreview` ловит свой MIME-тип. Можно смонтировать несколько превью рядом — отрисуется только
подходящее.

```tsx
import { Icon, FileUploadItem, FileUploadItemName, FileUploadItemPreview, FileUploadItemPreviewImage } from "@web-core/ui";

export function PreviewFileUploadDemo(props: { file: File }) {
  return (
    <FileUploadItem file={props.file}>
      <FileUploadItemPreview type="image/*">
        <FileUploadItemPreviewImage />
      </FileUploadItemPreview>

      <FileUploadItemPreview type=".*">
        <Icon name="file-text" />
      </FileUploadItemPreview>

      <FileUploadItemName />
    </FileUploadItem>
  );
}
```

Полезно проверить: `itemPreviewImage` — настоящий `<img>`, и на файле без типа изображения он
падает. Ставить его без охраняющего `type="image/*"` на превью нельзя — это не перестраховка, а
условие работы.

## 5. Убрать один файл и убрать все

`itemDeleteTrigger` убирает одну строку, `clearTrigger` — все принятые файлы разом; последний кит
прячет сам, пока список пуст.

```tsx
import { FileUpload, FileUploadClearTrigger, FileUploadItemGroup, FileUploadTrigger } from "@web-core/ui";

export function ClearFileUploadDemo() {
  return (
    <FileUpload data-variant="xxx">
      <FileUploadTrigger>Выбрать файлы</FileUploadTrigger>
      <FileUploadItemGroup type="accepted">{/* строки файлов */}</FileUploadItemGroup>
      <FileUploadClearTrigger>Очистить всё</FileUploadClearTrigger>
    </FileUpload>
  );
}
```

Полезно проверить: пока файлов нет, у `clearTrigger` стоит нативный `hidden` — отдельной метки
состояния под «список пуст» в паспорте нет, и подменять её нечем.

## 6. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Из данных приезжает только
подпись (`/label` по io-схеме); сами файлы в сборке — настоящие `File`, созданные ею.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineFileUploadDemo() {
  const data = { label: "Файлы" };

  return (
    <RenderTree
      tree={instanceOf("file-upload", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: в сборке сразу оба списка — принятый файл и отклонённый, чтобы было видно обе
ветки состояния. Наружу схемы загрузчик событий не отдаёт: выбор и удаление он ведёт сам, а узнать
о них можно колбэками корня (`onFileChange`/`onFileAccept`/`onFileReject`).

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: рамка зоны сброса, подсветка при перетаскивании,
обесцвеченное превью отклонённого файла приезжают формой скина. Смотреть живьём — на dev-сервере
приложения, где кит подключён вместе со скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка: в нём отклонённый файл обесцвечивается, а его имя и размер красятся тревожным цветом.
