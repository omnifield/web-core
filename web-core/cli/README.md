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
(`@web-core/cli/probe`): ставит опубликованный пакет в чистый проект вне репозитория, ставит его
peer-зависимости, проверяет каждый объявленный подпуть и проверяет типы. Имя пакета, версия и
адрес реестра приходят параметром — про чью-то конкретную поставку тулза не знает ничего.

🔎 Отчёт пробы разделяет **дефект поставки**, **поломку чужого пакета** и **предел самой проверки**:
у каждого подпути свой исход, и красной приёмка становится только от первого рода.

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
| Проба поставки | `@web-core/cli/probe` | `probeDelivery` (голая функция), `probeCommand` (та же работа командой), `isBlocking`, `isLimited` |

📂 `src/answer/` — конверт, его коды и печать (три файла: `index.ts`, `exit.ts`, `print.ts`).
`src/command/` — только типы декларации и `defineCommand`, исполнения там нет вовсе.
`src/program/` — сборка вендорной программы из декларации (`build.ts`), разрешение настроек по
слоям (`resolve.ts`) и запуск (`index.ts`). `src/settings/` — файл конфига. `src/probe/` — работа
пробы по шагам: `contract.ts` (формы запроса и отчёта), `delivery.ts` (порядок шагов),
`installed.ts` (что известно об установленном пакете), `runner.ts` (скрипт проверки подпутей и
разбор его записей), `verdict.ts` (исход подпути по ошибке Node), `command.ts` (та же работа
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
probe ./package-1.4.0.tgz --no-peers --no-types   # только установка и подпути, без чужих пакетов
```

🔎 Красной приёмку делают подпути с дефектом (`report.broken`); подпути, проверенные не до конца,
собраны отдельно (`report.limited`) и исход не меняют. Разобрать чужой отчёт можно теми же
мерками, которыми его считала проба:

```ts
import { isBlocking, isLimited } from "@web-core/cli/probe";

const defects = report.entries.filter(isBlocking);
const limits = report.entries.filter(isLimited);
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

🔎 У пробы поставки состояние мельче — **исход каждого подпути**. Первые три делают приёмку
красной, остальные исход не меняют:

| Исход подпути | Что это значит | Чем опознан |
|---|---|---|
| `delivery-broken` | дефект нашей поставки: `exports` ведёт в никуда, импорт директории в своём `dist` | ошибка резолюции или загрузки, а отказавший файл — в проверяемом пакете |
| `dependency-undeclared` | код тянет пакет, не объявленный ни зависимостью, ни peer'ом | `Cannot find package`, и имени нет в манифесте |
| `foreign-broken` | сломан чужой пакет, а не наш — чинить идти не сюда | тот же класс ошибки, но отказавший файл в чужом пакете (`blocker.culprit`) |
| `peer-missing` | объявленного peer'а нет на месте; необязательный (`optional`) — исполнение контракта пакета, а не поломка | `Cannot find package`, имя есть в `peerDependencies` |
| `node-refused` | модуль загрузился, но исполняться в Node отказался (браузерный код) | ошибка не про резолюцию: её бросил сам код |
| `ok` | подпуть проверен — импортом, импортом JSON или существованием файла (`checkedBy`) | — |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Механика | Принимает |
|---|---|
| `defineCommand(declaration)` | `name`, `summary`, `args?`, `options?`, `aliases?`, `run` |
| `run(input, context)` | `input.options` (значения по слоям), `input.args` (позиционные), `context` (`json`, `cwd`, `env`, `configPath?`) |
| `runProgram(program, options?)` | декларацию программы и подмену окружения прогона (`argv`, `channel`, `cwd`, `env`) |
| `printAnswer(answer, options?)` | конверт и режим (`json`, `channel`) |
| `loadConfig(name, options?)` | имя для поиска, явный `path`, `cwd` |
| `probeDelivery(request)` | `name` (имя пакета или путь к тарболу), `version?`, `registry?`, `installer?`, `entries?`, `projectDir?`, `peers?`, `types?`, `typescript?`, `timeoutMs?` |

<h3>📤 Выход</h3>

| Механика | Отдаёт |
|---|---|
| `done(summary, data?)` | `{ outcome: "done", summary, data }` |
| `nothing(summary)` | `{ outcome: "nothing", summary }` |
| `failed(summary, { remedy?, details? })` | `{ outcome: "failed", summary, remedy?, details? }` |
| `runProgram` | код возврата числом — печать уже сделана |
| `exitCodeFor(answer, codes?)` | число по исходу |
| `loadConfig` | `{ data, path? }` |
| `probeDelivery` | конверт с `ProbeReport`: `spec`, `installed`, `registry?`, `projectDir`, `entries` (по подпути: `verdict`, `checkedBy`, `resolved?`, `durationMs`, `blocker?`), `broken`, `limited`, `steps` (каждый шаг с `ok`, `command`, `durationMs`, `output`) |
| `blocker` подпути | `code?` (код Node), `message`, `culprit?` (чей файл отказал), `importedBy?`, `missing?` (недостающий пакет), `optional?` |
| `isBlocking(entry)` · `isLimited(entry)` | те же мерки, которыми проба считала `broken` и `limited` |

<h2 id="сборки">🏗️ Сборки</h2>

Проверки зоны — `pnpm --filter @web-core/cli test` (31 тест, 4 файла).

| Проверено | Как | Результат |
|---|---|---|
| Слои настройки | флаг · переменная окружения · файл · дефолт на одной команде | сильнее ровно тот слой, что выше |
| Коды возврата | конверт каждого исхода через `runProgram` | `0` · `0` · `1` · `2`, свои числа применяются |
| Тулза настоящим процессом | `test/fixtures/tool.ts` под `web-core-node`, `execFile` | коды `0`/`0`/`1`/`2` доходят до процесса, `--json` — одна строка в stdout |
| Проба ловит битый `exports` | тарбол, где `exports` ведёт в файл вне `files` | `delivery-broken` на этом подпуте, в `remedy` — команда для повтора руками |
| Проба берёт подпути из поставки | тарбол с двумя подпутями в `exports` | проверены оба, без ручного списка |
| Подпуть не модуль | тарбол с `.css` и `.json` в `exports`, один из них вне `files` | `.css` проверен файлом, `.json` импортирован с атрибутом, отсутствующий — `delivery-broken` |
| Необязательный peer | тарбол с `optional` peer'ом, прогон с `peers: false` | `peer-missing`, приёмка зелёная, подпуть в `limited` |
| Peer ставится, чужая поломка отделена | тот же пакет без `peers: false`, у peer'а дир-импорт внутри | появился шаг `install-peers`, исход `foreign-broken` с чужим `culprit` |
| Необъявленная зависимость | тарбол, импортирующий пакет из ниоткуда | `dependency-undeclared` с именем недостающего |
| Отказ исполнения в Node | тарбол, бросающий «Client-only API…» на импорте | `node-refused`, приёмка зелёная |
| Собственная поставка | `pnpm pack` → своя же проба с проверкой типов, 2026-09-23 | встала, оба подпути импортировались, `tsc --noEmit` зелёный |
| Живой реестр, восемь пакетов | `0.4.0` со стенда, 2026-09-23 | зелёные `store` (peer'ы встали) · `style` (`.css`) · `build` (`.json`) · `skin`; `ui` — два `node-refused`; `mcp` — единственный `delivery-broken`; `feeder@0.3.0` — `foreign-broken` на `@atlaskit/pragmatic-drag-and-drop` |

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
