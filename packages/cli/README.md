# 🖥️ web-core cli

🏷️ cli · 🧬 tooling · 📦 `@web-core/cli`

## 🧭 Навигация

- ✨ [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)
- 🗺️ [ROADMAP](./ROADMAP.yaml)

<h2 id="главное">✨ Главное</h2>

🧰 Из чего строят командные инструменты. Тулза объявляется **данными** — имя, позиционные
аргументы, флаги — и возвращает **конверт ответа**, а не печатает сама: печать, код возврата и
разрешение настроек берёт на себя движок. 📤 У любой тулзы на нём одинаково устроен вывод
(`--json` для машины, строка со значком для человека), одинаково устроен отказ (что случилось +
что делать дальше) и одинаково устроены коды возврата — «сделано» · «делать нечего» · «отказ» ·
«неверное употребление».

⚙️ Разбор аргументов делает [commander](https://github.com/tj/commander.js), поиск и чтение файла
конфига — [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig); своего парсера ни для того,
ни для другого здесь нет (почему именно они — [`FAQ.md`](./FAQ.md)).

📦 Рядом с движком едет одна тулза, написанная на нём же, — **проба поставки**
(`@web-core/cli/probe`): ставит опубликованный пакет в чистый проект вне репозитория, импортирует
его подпути и проверяет типы. Имя пакета, версия и адрес реестра приходят параметром — про чью-то
конкретную поставку тулза не знает ничего.

<h2 id="анатомия">🧩 Анатомия</h2>

У движка нет DOM и нет внутреннего состояния, которое можно было бы адресовать, — 🧩 «часть»
здесь означает точку входа поставки, а «адрес» — импорт-спецификатор.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Конверт ответа | `@web-core/cli` | `done`, `nothing`, `failed`, `isFailed` |
| Коды возврата | `@web-core/cli` | `DEFAULT_EXIT_CODES`, `exitCodeFor`, `withExitCodes` |
| Печать конверта | `@web-core/cli` | `printAnswer`, `processChannel` |
| Объявление команды | `@web-core/cli` | `defineCommand` |
| Запуск программы | `@web-core/cli` | `runProgram` |
| Файл конфига | `@web-core/cli` | `loadConfig`, `valueAt` |
| Проба поставки | `@web-core/cli/probe` | `probeDelivery` (голая функция), `probeCommand` (та же работа командой) |

📂 `src/answer/` — конверт, его коды и печать (три файла: `index.ts`, `exit.ts`, `print.ts`).
`src/command/` — только типы декларации и `defineCommand`, исполнения там нет вовсе.
`src/program/` — сборка вендорной программы из декларации (`build.ts`), разрешение настроек по
слоям (`resolve.ts`) и запуск (`index.ts`). `src/settings/` — файл конфига. `src/probe/` —
россыпь из двух вещей на одну работу: `delivery.ts` (функция) и `command.ts` (та же функция
командой), `index.ts` сводит их барелем.

<h2 id="использование">🚀 Использование</h2>

**Тулза из одной команды** — имя команды совпало с именем программы, значит подкоманда не нужна:

```ts
// bin/sync.ts потребителя
import { defineCommand, done, nothing, runProgram } from "@web-core/cli";

const sync = defineCommand({
  name: "sync",
  summary: "везёт накопленные правки в рабочий репозиторий",
  args: [{ name: "target", summary: "куда везём", required: true }],
  options: {
    branch: {
      flags: "--branch <name>",
      summary: "ветка приёмки",
      env: "SYNC_BRANCH",
      config: "sync.branch",
      default: "main",
    },
    dryRun: { flags: "--dry-run", summary: "показать план и выйти" },
  },
  run({ options, args }) {
    const changes = collectChanges(args[0], options.branch);
    return changes.length === 0
      ? nothing("накопленных правок нет")
      : done(`отвезено правок: ${changes.length}`, { branch: options.branch, changes });
  },
});

process.exitCode = await runProgram({ name: "sync", summary: "синк правок", commands: [sync] });
```

```bash
sync studio --branch release --json   # {"outcome":"done","summary":"…","data":{…}}
sync studio                           # ✔ отвезено правок: 3
```

**Несколько команд** — каждая становится подкомандой (`tool plan`, `tool publish`):

```ts
process.exitCode = await runProgram({
  name: "release",
  summary: "выпуск",
  version: "1.0.0",
  commands: [plan, publish],
  exitCodes: { nothing: 3 },
});
```

**Проба поставки** — голой функцией или командой в своей программе:

```ts
import { probeCommand, probeDelivery } from "@web-core/cli/probe";

const answer = await probeDelivery({
  name: "@scope/package",
  version: "1.4.0",
  registry: "https://registry.example.dev/",
});

process.exitCode = await runProgram({
  name: "probe",
  summary: "приёмка поставки",
  commands: [probeCommand("probe")],
});
```

```bash
probe @scope/package 1.4.0 --registry https://registry.example.dev/ --json
```

<h2 id="настройки">🎚️ Настройки</h2>

**Настройка тулзы** объявляется полем в `options` команды и разрешается по слоям — **аргумент →
переменная окружения → файл конфига → значение по умолчанию**. Ни одна настройка не имеет права
быть зашитой в код: та же тулза обязана работать в чужом клоне через переменные.

| Поле | Тип | Смысл |
|---|---|---|
| `flags` | `string` | синтаксис флага вендора: `--registry <url>`, `--dry-run`, `--tag [name]` |
| `summary` | `string` | строка в справке |
| `env` | `string` | имя переменной окружения — второй слой |
| `config` | `string` | путь в файле конфига через точку (`publish.registry`) — третий слой |
| `default` | `unknown` | четвёртый слой |
| `required` | `boolean` | не дал ни один слой — «неверное употребление», а не отказ |
| `choices` | `readonly string[]` | допустимые значения |
| `parse` | `(raw, previous) => unknown` | разбор значения; определяет и тип в `run` |

**Настройки программы** — `runProgram`:

| Настройка | Тип | По умолчанию |
|---|---|---|
| `version` | `string` | нет (тогда нет и `--version`) |
| `exitCodes` | `Partial<ExitCodes>` | `{ done: 0, nothing: 0, failed: 1, usage: 2 }` |
| `configName` | `string` | имя программы — под ним cosmiconfig ищет файл |
| `argv` | `readonly string[]` | `process.argv.slice(2)` |
| `channel` | `AnswerChannel` | `process.stdout` / `process.stderr` |
| `cwd`, `env` | `string`, `Record<string, string \| undefined>` | `process.cwd()`, `process.env` |

🚩 Два флага движок добавляет каждой команде сам: `--json` (машинный ответ) и `--config <path>`
(файл конфига вместо поиска).

<h2 id="состояния">🎛️ Состояния</h2>

Рантайм-состояния у движка два рода: **исход команды** (он же код возврата) и **режим вывода**.

| Состояние | Метка | Код возврата |
|---|---|---|
| Сделано | `outcome: "done"`, строка `✔ …` в stdout | `0` |
| Делать нечего | `outcome: "nothing"`, строка `• …` в stdout | `0` (настраивается) |
| Отказ | `outcome: "failed"`, строки `✖ …` и `  → …` в stderr | `1` |
| Неверное употребление | тот же конверт отказа; поднимает вендор или проверка `required` | `2` |
| Исключение внутри команды | конверт отказа, `details` несёт имя и стек | `1` |
| Машинный вывод | `--json`: в stdout ровно одна строка JSON, человеческой печати нет | по исходу |
| Файл конфига найден | `context.configPath` — путь | — |
| Файла конфига нет | `context.configPath === undefined`, слой просто не участвует | — |
| Тулза из одной команды | имя команды совпало с именем программы — подкоманда не нужна | — |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Механика | Принимает |
|---|---|
| `defineCommand(declaration)` | `name`, `summary`, `args?`, `options?`, `aliases?`, `run` |
| `run(input, context)` | `input.options` (значения по слоям), `input.args` (позиционные), `context` (`json`, `cwd`, `env`, `configPath?`) |
| `runProgram(program, options?)` | декларацию программы и подмену окружения прогона (`argv`, `channel`, `cwd`, `env`) |
| `printAnswer(answer, options?)` | конверт и режим (`json`, `channel`) |
| `loadConfig(name, options?)` | имя для поиска, явный `path`, `cwd` |
| `probeDelivery(request)` | `name` (имя пакета или путь к тарболу), `version?`, `registry?`, `installer?`, `entries?`, `projectDir?`, `types?`, `typescript?`, `timeoutMs?` |

<h3>📤 Выход</h3>

| Механика | Отдаёт |
|---|---|
| `done(summary, data?)` | `{ outcome: "done", summary, data }` |
| `nothing(summary)` | `{ outcome: "nothing", summary }` |
| `failed(summary, { remedy?, details? })` | `{ outcome: "failed", summary, remedy?, details? }` |
| `runProgram` | код возврата числом — печать уже сделана |
| `exitCodeFor(answer, codes?)` | число по исходу |
| `loadConfig` | `{ data, path? }` |
| `probeDelivery` | конверт с `ProbeReport`: `spec`, `installed`, `registry?`, `projectDir`, `entries`, `steps` (каждый шаг с `ok`, `command`, `durationMs`, `output`) |

<h2 id="сборки">🏗️ Сборки</h2>

Проверки зоны — `pnpm --filter @web-core/cli test` (26 тестов, 4 файла).

| Проверено | Как | Результат |
|---|---|---|
| Слои настройки | флаг · переменная окружения · файл · дефолт на одной команде | сильнее ровно тот слой, что выше |
| Коды возврата | конверт каждого исхода через `runProgram` | `0` · `0` · `1` · `2`, свои числа применяются |
| Тулза настоящим процессом | `test/fixtures/tool.ts` под `web-core-node`, `execFile` | коды `0`/`0`/`1`/`2` доходят до процесса, `--json` — одна строка в stdout |
| Проба ловит битый `exports` | тарбол, где `exports` ведёт в файл вне `files` | отказ на шаге `import`, в `remedy` — команда для повтора руками |
| Проба берёт подпути из поставки | тарбол с двумя подпутями в `exports` | проверены оба, без ручного списка |
| Собственная поставка | `pnpm pack` → своя же проба с проверкой типов, 2026-09-23 | встала, оба подпути импортировались, `tsc --noEmit` зелёный |

<h2 id="рецепт">🎨 Рецепт</h2>

Съёмный 🔌 слой движка — **сама тулза**: команда живёт снаружи, движок её не знает, а обязан
покрыть целиком (аргументы, настройки, исход, печать). Пилот рецепта — проба поставки, и она же
показывает приём, которым команда остаётся пригодной для будущего MCP-фасада: работа написана
голой функцией (`probeDelivery`), а команда — тонкой оболочкой над ней (`probeCommand`).

```ts
import { defineCommand } from "@web-core/cli";

import { doTheWork } from "./work";

export const work = defineCommand({
  name: "work",
  summary: "делает работу",
  options: { target: { flags: "--target <name>", summary: "над чем", config: "work.target" } },
  run: ({ options }) => doTheWork(options.target),
});
```
