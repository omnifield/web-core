// Слой `@layer` jsdom не разбирает, поэтому правило сверяется с узлом селектором, а не
// `getComputedStyle` — разбор в `FAQ.md` зоны.
export function declarationsFor(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`в сгенерированном CSS нет правила для ${selector}`);
  return css.slice(at, css.indexOf("\n  }", at));
}
