import { createSignal, For, Show } from "@web-core/solid";
import {
  Button,
  Field,
  FieldInput,
  FieldLabel,
  Flow,
  Listbox,
  ListboxContent,
  ListboxItem,
  ListboxItemIndicator,
  ListboxItemText,
  ListboxLabel,
  Surface,
  Typography,
} from "@web-core/ui";

import { useUsers } from "../../entities/user";

export function Users() {
  const team = useUsers();
  const [name, setName] = createSignal("");

  const items = () =>
    team.users().map((user) => ({
      value: user.id,
      label: user.active ? user.name : `${user.name} (не на дежурстве)`,
    }));

  const hire = () => {
    const typed = name().trim();
    if (typed === "") return;

    team.hire(typed, "новичок");
    setName("");
  };

  return (
    <Surface data-variant="filled">
      <Flow data-variant="column">
        <Typography as="h1" data-variant="display">
          Команда
        </Typography>
        <Typography data-variant="body">
          Список и карточка читают одно состояние сущности, а кнопки меняют его
          действиями стора — своего состояния на странице нет.
        </Typography>

        <Listbox
          items={items()}
          value={team.selected() ? [team.selected()!.id] : []}
          onValueChange={(details) => team.select(details.value[0])}
        >
          <ListboxLabel>Сотрудники</ListboxLabel>
          <ListboxContent>
            <For each={items()}>
              {(item) => (
                <ListboxItem item={item}>
                  <ListboxItemText>{item.label}</ListboxItemText>
                  <ListboxItemIndicator>✓</ListboxItemIndicator>
                </ListboxItem>
              )}
            </For>
          </ListboxContent>
        </Listbox>

        <Show
          when={team.selected()}
          fallback={
            <Typography data-variant="body">
              Выберите сотрудника из списка.
            </Typography>
          }
        >
          {(selected) => (
            <Flow data-variant="column">
              <Typography data-variant="body-strong">
                {selected().name} — {selected().role}
              </Typography>
              <Flow data-variant="row">
                <Button
                  data-variant="secondary"
                  onClick={() => team.toggleActive(selected().id)}
                >
                  {selected().active ? "Снять с дежурства" : "Вернуть в строй"}
                </Button>
                <Button
                  data-variant="error"
                  onClick={() => team.dismiss(selected().id)}
                >
                  Уволить
                </Button>
              </Flow>
            </Flow>
          )}
        </Show>

        <Flow data-variant="row">
          <Field data-variant="outline">
            <FieldLabel>Кого нанимаем</FieldLabel>
            <FieldInput
              value={name()}
              onInput={(event) => setName(event.currentTarget.value)}
            />
          </Field>
          <Button data-variant="primary" onClick={hire}>
            Нанять
          </Button>
        </Flow>

        <Typography data-variant="caption">
          На дежурстве: {team.activeCount()} из {team.users().length}
        </Typography>
      </Flow>
    </Surface>
  );
}
