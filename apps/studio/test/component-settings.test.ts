// Доска настроек (`entities/settings`). Проверяется на НАСТОЯЩЕМ паспорте кита, а не на
// выдуманном: смысл доски в том, что список настроек и их зависимости приходят из паспорта, и
// тест на самодельной записи проверял бы только сам себя.

import { describe, expect, it } from "vitest";
import { passportOf } from "@web-core/ui/passport";
import {
  effectiveValues,
  rootPropsOf,
  settingsOf,
  settingsStoreOf,
} from "#/entities/settings";

const accordion = passportOf("accordion")!.settings;
const button = passportOf("button")!.settings;

describe("настройки берутся из паспорта, а не из витрины", () => {
  it("список — объявленные компонентом имена в объявленном порядке", () => {
    expect(settingsOf(accordion, undefined, {}).map(({ name }) => name)).toEqual(
      ["orientation", "multiple", "collapsible"],
    );
  });

  it("компонент без настроек оставляет список пустым", () => {
    expect(settingsOf(button, undefined, {})).toEqual([]);
  });

  it("человеческая половина приезжает рядом с машинной", () => {
    const means = { multiple: { means: "сразу несколько" } };
    const multiple = settingsOf(accordion, means, {}).find(
      ({ name }) => name === "multiple",
    );

    expect(multiple?.means?.means).toBe("сразу несколько");
    expect(multiple?.setting.values.kind).toBe("flag");
  });
});

describe("умолчание живёт в паспорте, в сторе — только выбранное", () => {
  it("нетронутая настройка показывает умолчание паспорта", () => {
    expect(effectiveValues(accordion, {})).toEqual({
      orientation: "vertical",
      multiple: false,
      collapsible: false,
    });
  });

  it("выбранное человеком перекрывает умолчание, соседей не трогая", () => {
    expect(effectiveValues(accordion, { orientation: "horizontal" })).toEqual({
      orientation: "horizontal",
      multiple: false,
      collapsible: false,
    });
  });
});

describe("зависимость настроек считает паспорт", () => {
  it("collapsible теряет смысл, когда включён multiple", () => {
    const applies = (chosen: Record<string, string | boolean>) =>
      Object.fromEntries(
        settingsOf(accordion, undefined, chosen).map((setting) => [
          setting.name,
          setting.applies,
        ]),
      );

    expect(applies({})).toMatchObject({ collapsible: true });
    expect(applies({ multiple: true })).toMatchObject({
      multiple: true,
      collapsible: false,
    });
  });

  it("в показ уезжает только то, что сейчас имеет смысл", () => {
    expect(rootPropsOf(settingsOf(accordion, undefined, { multiple: true }))).toEqual(
      { orientation: "vertical", multiple: true },
    );
  });
});

describe("доска у каждого компонента своя", () => {
  it("выбор соседа не виден и не подменяется", () => {
    const accordionStore = settingsStoreOf("accordion");
    const tabsStore = settingsStoreOf("tabs");

    accordionStore.actions.choose("orientation", "horizontal");

    expect(accordionStore.selectors.chosen()).toEqual({
      orientation: "horizontal",
    });
    expect(tabsStore.selectors.chosen()).toEqual({});
  });
});
