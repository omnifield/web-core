import { defineQuery } from "@web-core/query";
import { type ComponentDocs, docsOf as kitDocsOf } from "@web-core/ui/docs";
import { queryClient } from "#/shared/api/clients";

/** Компонент без единого документа — законный исход, не отказ: кэшу нужно класть запись, а не
 *  `undefined`. */
export const NO_DOCS: ComponentDocs = {};

/** Документы компонента лежат в поставке кита отдельными кусками — карта ленивая, и текст едет
 *  только за тем компонентом, которого открыли. */
export const docsOf = defineQuery(
  queryClient,
  (componentName: string) => ["docs", componentName],
  async (componentName: string) => {
    // Документы приезжают модулем поставки, а такой объект нерасширяем: стор запроса не может
    // пометить его своим и роняет страницу. В кэш кладём свою запись.
    const docs = await kitDocsOf(componentName);

    return docs === undefined ? NO_DOCS : { ...docs };
  },
  { staleTime: Infinity },
);
