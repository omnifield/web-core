// Арифметика двумерной плоскости матрицы (`features/component-manager/lib/plane.ts`).
//
// Матрицу до этого собирали вложенными каруселями и не собрали ни разу. Разбор 2026-09-18
// (след в `ui/demo-stand/README.md`) показал две причины, и обе проверяются здесь:
//
// 1. Позиция — не отдельное состояние, а арифметика от смещения скролла. Пока она была
//    состоянием двух каруселей, эти состояния приходилось синхронизировать.
// 2. Рамок на плоскости N×M, и это дёшево. Дорог РЕНДЕР компонента через движок сборки, и
//    именно N×M живых рендеров роняли браузер. Окно отделяет «рамка есть» от «рендер живой».

import { describe, expect, it } from "vitest";
import {
  snapIndexAt,
  withinWindow,
} from "#/features/component-manager/lib/plane";

describe("snapIndexAt — позиция считается от скролла, а не хранится", () => {
  it("целое число вьюпортов даёт ровно свою рамку", () => {
    expect(snapIndexAt(0, 100, 5)).toBe(0);
    expect(snapIndexAt(300, 100, 5)).toBe(3);
  });

  it("на полпути округляет к ближайшей, а не отбрасывает хвост", () => {
    expect(snapIndexAt(140, 100, 5)).toBe(1);
    expect(snapIndexAt(160, 100, 5)).toBe(2);
  });

  it("за пределами списка отдаёт крайнюю, а не индекс в пустоту", () => {
    expect(snapIndexAt(9000, 100, 5)).toBe(4);
    expect(snapIndexAt(-50, 100, 5)).toBe(0);
  });

  it("неразложенный элемент (нулевой размер) даёт первую, а не NaN", () => {
    // Иначе `NaN` молча уезжает в `scrollTo` и плоскость встаёт в неопределённое место.
    expect(snapIndexAt(0, 0, 5)).toBe(0);
    expect(snapIndexAt(120, 0, 5)).toBe(0);
  });

  it("пустая ось не ломается", () => {
    expect(snapIndexAt(0, 100, 0)).toBe(0);
  });
});

describe("withinWindow — живой рендер только вокруг текущей позиции", () => {
  it("текущая и оба соседа живые", () => {
    expect(withinWindow(4, 5)).toBe(true);
    expect(withinWindow(5, 5)).toBe(true);
    expect(withinWindow(6, 5)).toBe(true);
  });

  it("через одну — уже нет: это и есть отсечка N×M", () => {
    expect(withinWindow(3, 5)).toBe(false);
    expect(withinWindow(7, 5)).toBe(false);
  });

  it("окно не зависит от размера оси — сотая рамка так же дёшева, как третья", () => {
    expect(withinWindow(99, 100)).toBe(true);
    expect(withinWindow(0, 100)).toBe(false);
  });
});
