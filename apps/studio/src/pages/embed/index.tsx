import { Icon } from "@web-core/ui";

/**
 * Изолированный показ ОДНОГО компонента+сборки, без хрома витрины (`Header`/сайдбар/чат) —
 * `/embed/<component>/<assembly>` для агента, работающего со сборками через MCP-браузер
 * (`apps/skin/.mcp`'s `browser_navigate`), не для живой витрины юзера.
 *
 * Показ здесь ещё не подключён к нынешней архитектуре (активная ячейка + `useFeed`) —
 * маршрут живой, а отдаёт заглушку. Пропсы приняты и не читаются намеренно: их даёт маршрут, и
 * подключать их будет тот, кто вернёт сюда показ.
 */
export function EmbedPage(_props: {
  component: string;
  assembly: string;
  content?: string;
}) {
  // const component = componentHandle();

  // const [content] = createResource(() => props.content, getContentByName);

  // Источник наполнения — только именованный content: не задан или не найден → данных нет.
  // createEffect(() => {
  //   if (!component.info()) return;
  //   if (props.content !== undefined && content.loading) return;

  //   const record = content();
  //   if (record) component.setData(record.state.data);
  // });

  return <Icon name="trash" />;
}
