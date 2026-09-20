import { ApiProbe } from "@web-core/feeder";
import { COMPONENT_USER, useComponent } from "#/entities/component";
import { useFeed } from "#/entities/feed";

/**
 * Кормление живой ручкой: дёрнул — компонент ест то, что она вернула.
 *
 * Показаны не все ручки, а только связанные с ЭТИМ компонентом: отбор по потребителю делает сам
 * каталог, студия ему только называет, кого кормит. Связь заводится в лаборатории, здесь её
 * только используют.
 *
 * Еда приезжает уже собранной по форме компонента (`serving.data`) — разворачивать записи и
 * угадывать, где у компонента список, здесь нечего: это знает адаптер. Адаптера для пары нет —
 * `data` не придёт вовсе, и кормить нечем: ответ получен, а сводить его не с чем.
 *
 * Сборка, сказавшая об ошибке, едой НЕ считается, хотя объект при этом приезжает: промахнувшийся
 * по корню адаптер отдаёт пустую форму (`{items: []}`), и подать её — значит молча стереть то,
 * чем компонент уже накормлен. Прежняя еда остаётся, пока не приедет настоящая.
 */
export function FeedOpenapi() {
  const component = useComponent();
  const feed = useFeed();

  return (
    <ApiProbe
      consumer={COMPONENT_USER.path(component.name)}
      onServing={(event) => {
        const { data, error } = event.serving;
        if (data === undefined || error !== null) return;

        feed.serve("openapi", data);
      }}
    />
  );
}
