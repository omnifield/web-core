import { useRouteParamSelection } from "@web-core/router";

/** Склейка `CatalogTree` с роутингом: активный пункт — из названного параметра текущего
 *  маршрута, выбор — переход по `to` с тем же параметром. Виджет каталога остаётся немым
 *  (`activeValue`/`onSelect` как сырые пропсы) — про роутер знает только этот адаптер, сама
 *  склейка `useParams`+`useNavigate` — в пакете (`useRouteParamSelection`). */
export function useRouterCatalogSelection(options: {
  param: string;
  to: string;
}) {
  const selection = useRouteParamSelection(options.param, options.to);

  return {
    get activeValue() {
      return selection.value;
    },
    onSelect: selection.select,
  };
}
