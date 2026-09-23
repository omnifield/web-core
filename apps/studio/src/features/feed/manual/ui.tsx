import { Show } from "@web-core/solid";
import { TreeForm } from "@web-core/feeder";
import { useInfo } from "#/entities/component";
import { useFeed } from "#/entities/feed";

/**
 * Кормление руками: форма по io-схеме компонента правит то, что лежит на доске сейчас.
 *
 * Своего состояния у поставщика нет намеренно — черновик и есть еда, второй копии рядом не
 * нужно. Поэтому форма показывает и правку чужой подачи тоже: взял запись, поправил поле —
 * дальше это уже своя еда, и метка на доске меняется на эту панель.
 */
export function FeedManual() {
  const component = useInfo();
  const feed = useFeed(component.name);
  const schema = () => component.io()?.schema;

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <TreeForm
          schema={schema}
          value={feed.data()}
          onChange={(next) => feed.serve("manual", next)}
        />
      )}
    </Show>
  );
}
