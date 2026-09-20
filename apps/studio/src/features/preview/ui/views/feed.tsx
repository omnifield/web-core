import { Json } from "./json";

export function Feed(props: { feedData: unknown }) {
  return <Json data={props.feedData} empty="данные не заданы" />;
}
