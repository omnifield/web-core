import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport";

type NavigationMenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<NavigationMenuPart, PassportPartEditorInfo<NavigationMenuPart>>> = {
  root: {
    means: "всё меню навигации целиком — полоса разделов вместе с раскрытой панелью",
    variables: {
      "--trigger-width": { means: "измеренная ширина раскрытого сейчас раздела" },
      "--trigger-height": { means: "измеренная высота раскрытого сейчас раздела" },
      "--trigger-x": { means: "измеренное горизонтальное положение раскрытого раздела" },
      "--trigger-y": { means: "измеренное вертикальное положение раскрытого раздела" },
      "--viewport-width": { means: "измеренная ширина панели, которая сейчас показана" },
      "--viewport-height": { means: "измеренная высота панели, которая сейчас показана" },
      "--viewport-x": { means: "измеренное горизонтальное положение панели" },
      "--viewport-y": { means: "измеренное вертикальное положение панели" },
    },
    accepts: [
      { kind: "component", name: "list" },
      { kind: "component", name: "viewportPositioner" },
    ],
  },
  list: {
    means: "полоса (или столбец) разделов — оборачивает каждый раздел и скользящий указатель",
    accepts: [
      { kind: "component", name: "item" },
      { kind: "component", name: "indicator" },
    ],
  },
  item: {
    means: "один раздел меню — либо кнопка с панелью, либо сразу ссылка без панели",
    states: {
      open: { means: "панель этого раздела сейчас раскрыта" },
      closed: { means: "панель этого раздела закрыта" },
      disabled: { means: "этот раздел нельзя раскрыть" },
    },
    accepts: [
      { kind: "component", name: "trigger" },
      { kind: "component", name: "content" },
      { kind: "component", name: "link" },
    ],
  },
  trigger: {
    means: "кнопка раздела — раскрывает его панель наведением или нажатием",
    states: {
      open: { means: "этот раздел раскрыт — панель под ним видна" },
      closed: { means: "этот раздел закрыт" },
      disabled: { means: "раздел нельзя раскрыть" },
      hover: { means: "указатель наведён на раздел" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
      active: { means: "раздел нажат и удерживается" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
  content: {
    means: "панель раздела — место, куда потребитель кладёт ссылки и что угодно ещё",
    states: {
      open: { means: "панель раскрыта" },
      closed: { means: "панель закрыта — прячет её нативный `hidden`, не правило вида" },
    },
    accepts: [
      { kind: "component", name: "link" },
      { kind: "component" },
    ],
  },
  link: {
    means: "ссылка — уводит на другой адрес; живёт и внутри панели, и прямо в полосе разделов",
    states: {
      current: { means: "адрес этой ссылки — то, что открыто сейчас" },
      hover: { means: "указатель наведён на ссылку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры" },
      active: { means: "ссылка нажата и удерживается" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  indicator: {
    means: "скользящий указатель под раскрытым разделом — едет по измеренному положению раздела",
    states: {
      open: { means: "какой-то раздел раскрыт — указатель виден" },
      closed: { means: "всё закрыто — указатель спрятан нативным `hidden`" },
    },
    accepts: [{ kind: "component", name: "arrow" }],
  },
  itemIndicator: {
    means: "пометка раскрытого раздела — существует в разметке только пока раздел раскрыт",
    states: {
      open: { means: "раздел раскрыт — пометка есть" },
      closed: { means: "раздел закрыт — пометку убирает нативный `hidden`" },
    },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  viewport: {
    means: "общая панель, в которую переезжает содержимое раскрытого раздела — одна на всё меню",
    states: {
      open: { means: "какой-то раздел раскрыт — панель видна" },
      closed: { means: "всё закрыто — панель спрятана нативным `hidden`" },
    },
    variables: {
      "--viewport-width": { means: "измеренная ширина содержимого раскрытого раздела" },
      "--viewport-height": { means: "измеренная высота содержимого раскрытого раздела" },
      "--viewport-x": { means: "измеренное горизонтальное положение панели" },
      "--viewport-y": { means: "измеренное вертикальное положение панели" },
    },
    accepts: [],
  },
  viewportPositioner: {
    means: "место, где стоит общая панель — держит её под полосой разделов",
    accepts: [{ kind: "component", name: "viewport" }],
  },
  arrow: {
    means: "клин, указывающий от панели на раскрытый раздел — просто бокс, своего графика не несёт",
    accepts: [],
  },
};
