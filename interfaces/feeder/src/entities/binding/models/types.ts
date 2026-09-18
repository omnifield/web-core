import type { ExtraPolicy, FieldRef, FieldRule } from "@web-core/io";

/** Откуда берётся еда: ручка конкретного API плюс параметры, с которыми её дёргать. Ручка — по
 *  айди (`endpointKey`), а не объектом: привязка обязана быть чистым JSON, чтобы потребитель мог
 *  сохранить её на бэк и поднять обратно, а `OpenapiEndpoint` несёт в себе `z.ZodType` и не
 *  сериализуется. */
export interface BindingSource {
  readonly apiId: string;
  readonly endpointId: string;
  /** Значения параметров вызова, как их настроили в редакторе ручки. */
  readonly value?: unknown;
}

/**
 * Привязка ручки к компоненту — и она же адаптер: `rules` не отдельная сущность рядом, а
 * содержимое стыка. Разложено на три вопроса, каждый из которых io умеет отдельно:
 * ГДЕ записи в ответе (`root`, L3), КАК одна запись ложится на вход компонента (`rules`, L2),
 * что делать с чужими полями (`extra`).
 *
 * `rules: []` — законное состояние «привязано, но не сведено»: ручку выбрали, поля ещё нет.
 * Именно поэтому привязка и адаптер — одна запись, а не две: вторая без первой бессмысленна.
 */
export interface Binding {
  readonly source: BindingSource;
  /** JSON Pointer до набора записей в ответе; `""` — сам ответ целиком. */
  readonly root: FieldRef;
  readonly rules: readonly FieldRule[];
  readonly extra?: ExtraPolicy;
}

/** Потребитель еды — имя и форма его входа (зод-схема или сэмпл). Форму приносит приложение,
 *  а не движок: «где взять io-схему по имени компонента» знает оно, а сведение обязано работать
 *  и для потребителя не из кита. */
export interface Consumer {
  readonly name: string;
  readonly input: unknown;
}

/** Айди привязки внутри одного компонента — API плюс ручка: одну и ту же ручку того же бэка
 *  привязывать к одному компоненту дважды нечем (правила были бы просто перезаписью). */
export function bindingKey(source: BindingSource): string {
  return `${source.apiId} ${source.endpointId}`;
}

/** Привязка доведена до конца — у неё есть адаптер. Без правил вызов ручки даст ноль записей
 *  на входе компонента, и показать это надо ДО вызова, а не отчётом после. */
export function isFed(binding: Binding): boolean {
  return binding.rules.length > 0;
}
