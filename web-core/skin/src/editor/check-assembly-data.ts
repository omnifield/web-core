// см. README.md / FAQ.md

import { isAssemblyContent, isAssemblyRepeat, isDataBinding, resolveDataBinding, scopedPath } from "../engine/passport/assembly/index.js";
import type { PassportAssembly, PassportAssemblyElement, PassportAssemblyNode } from "../engine/passport/assembly/index.js";

/** Тот же предел, что у разворота дерева — разбор в FAQ.md. */
const MAX_WALK_DEPTH = 300;

export interface AssemblyDataFlaw {
  /** Адрес узла в дереве, человекочитаемо: `accordion.base > item[] > itemTrigger.bind.value`. */
  readonly where: string;
  /** Путь, как он написан в записи — то, что автору нужно поправить. */
  readonly path: string;
  readonly means: string;
}

/**
 * Проверяет КАЖДЫЙ `bind`/`repeat.path`/`value.path` дерева сборки против настоящего значения
 * данных. Пустой путь легален всегда и проверке не подлежит. Разбор — FAQ.md.
 *
 * @param component имя компонента — только для адреса в сообщении
 * @param assembly дерево сборки целиком
 * @param data настоящее значение, с которым сверяются пути — пример по io-схеме или боевые данные
 */
export function checkAssemblyData<Part extends string, Registry extends string = string, Data = unknown>(
  component: string,
  assembly: PassportAssembly<Part, Registry, Data>,
  data: unknown,
): readonly AssemblyDataFlaw[] {
  const flaws: AssemblyDataFlaw[] = [];

  // Перетипирование в разрешающую форму один раз на входе — FAQ.md.
  const tree = assembly.tree as PassportAssemblyElement<Part, Registry>;

  const checkOne = (where: string, path: string, base: string, mustBeArray: boolean): { absolute: string; ok: boolean } => {
    const absolute = scopedPath(base, path);
    if (path === "") return { absolute, ok: true };

    const value = resolveDataBinding(data, absolute);

    if (value === undefined) {
      flaws.push({ where, path, means: `path "${path}" resolves to nothing against the example data — likely a typo or a field the io schema doesn't declare` });
      return { absolute, ok: false };
    }

    if (mustBeArray && !Array.isArray(value)) {
      flaws.push({ where, path, means: `path "${path}" resolves to a non-array value — "repeat" needs a list to iterate` });
      return { absolute, ok: false };
    }

    return { absolute, ok: true };
  };

  const walk = (node: PassportAssemblyNode, base: string, where: string, depth: number): void => {
    if (depth > MAX_WALK_DEPTH) {
      flaws.push({
        where,
        path: "",
        means: `checking this assembly against the example data grew past ${MAX_WALK_DEPTH} levels — a self-recursing node with no exit in the example data, or data that cycles back on itself, never stops on its own`,
      });
      return;
    }

    if (isAssemblyRepeat(node)) {
      const { absolute, ok } = checkOne(where, node.repeat.path, base, true);
      // Не разрешившийся путь повтора дальше не раскрывается — FAQ.md.
      if (ok) walk(node.template, `${absolute}/0`, `${where}[]`, depth + 1);
      return;
    }

    if ("repeat" in node && node.repeat) {
      const { repeat, ...template } = node;
      const { absolute, ok } = checkOne(where, repeat.path, base, true);
      if (ok) walk(template as PassportAssemblyNode, `${absolute}/0`, `${where}[]`, depth + 1);
      return;
    }

    if (isAssemblyContent(node)) {
      if (isDataBinding(node.value)) checkOne(`${where}.value`, node.value.path, base, false);
      return;
    }

    const label = node.node;

    for (const [prop, path] of Object.entries(node.bind ?? {})) checkOne(`${where}.bind.${prop}`, path, base, false);
    for (const child of node.children ?? []) walk(child, base, `${where} > ${label}`, depth + 1);

    // `recur` обходит ТОТ ЖЕ узел уровнем глубже по данным — узел здесь не переписывается, путь
    // разрешается против протянутой базы.
    if ("recur" in node && node.recur) {
      const { absolute, ok } = checkOne(`${where}.recur`, node.recur.path, base, true);
      if (ok) walk(node, `${absolute}/0`, `${where}[]`, depth + 1);
    }
  };

  walk(tree, "", `${component}.${assembly.name}`, 0);
  return flaws;
}
