const entries = Object.values(
  import.meta.glob<{ name: string }>("../data/*.json", { eager: true, import: "default" }),
);

export function Globbed() {
  return <p data-testid="globbed">{entries.length}</p>;
}
