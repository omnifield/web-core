import { Json } from "./json";

// Источника данных у этого вида пока нет: `Switcher` зовёт его с `undefined`, потому что в сторе
// стиля ячейки не лежит ничего. Это не «пусто по данным», а незаведённая ветка — и она названа
// словами, а не показывается подписью `undefined`.
export function Style(props: { styleData: unknown }) {
  return <Json data={props.styleData} empty="стиль сюда пока не подключён" />;
}
