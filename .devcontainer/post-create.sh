#!/usr/bin/env bash
# Репо-зависимая цепочка девбокса: названные потери тулчейна, права на общие тома, seed
# claude-онбординга, доступ к реестру, установка зависимостей. Зовётся из `postCreateCommand`,
# то есть уже поверх смонтированного репозитория.
set -u

step_at=""

step() {
  step_at="$1"
  printf '[devbox] шаг %s\n' "$1" >&2
}

stop() {
  printf '[devbox] ОТКАЗ на шаге %s (код %s)\n' "$step_at" "$1" >&2
  exit "$1"
}

run() {
  "$@" || stop "$?"
}

has() {
  command -v "$1" >/dev/null 2>&1
}

# 1/5 — девбокс НОДОВЫЙ: остальные тулчейны приезжают фичами. Объявленный репозиторием, но
# отсутствующий тулчейн называется вслух здесь, иначе о потере узнают из красного таргета.
step '1/5 toolchain — названные потери тулчейна'
lost=""

declares_uv() { [ -f uv.lock ] || grep -qs '^\[tool.uv\]' pyproject.toml; }
declares_python() { [ -f .python-version ] || [ -f pyproject.toml ]; }
declares_go() {
  [ -f go.mod ] ||
    [ -n "$(find . -maxdepth 3 -name go.mod -not -path './node_modules/*' -print -quit 2>/dev/null)" ]
}

if declares_uv && ! has uv; then
  printf '%s\n' '[devbox] Репозиторий объявляет uv (uv.lock, [tool.uv] в pyproject.toml), а команды uv в девбоксе нет.' >&2
  lost=1
fi

if declares_python && ! declares_uv && ! has python && ! has python3; then
  printf '%s\n' '[devbox] Репозиторий объявляет питон (.python-version, pyproject.toml), а ни одной из команд python, python3 в девбоксе нет.' >&2
  lost=1
fi

# go.mod ищется и внутри пакетов: у этого репозитория он лежит в `backend/presets` и
# `products/windshift`, а корневого нет вовсе — проверка по одному корню молчала бы зря.
if declares_go && ! has go; then
  printf '%s\n' '[devbox] Репозиторий объявляет go (go.mod в корне или внутри пакета), а команды go в девбоксе нет.' >&2
  lost=1
fi

if [ -n "$lost" ]; then
  printf '%s\n' \
    '[devbox] Девбокс НОДОВЫЙ: базовый образ несёт node/pnpm/git, остальные тулчейны приезжают фичами Dev Containers.' \
    '[devbox] Добавь нужные в "features" файла настроек девбокса и пересоздай контейнер.' \
    '[devbox] Каталог фич: https://containers.dev/features' \
    '[devbox] Пока их нет — таргеты этого тулчейна упадут, и обычно первым же git commit.' >&2
fi

# 2/5 — общие тома приезжают от рута, работаем под node.
step '2/5 volumes — права на общие тома'
run sudo chown -R node:node /home/node/.secrets /home/node/.pnpm-store

# 3/5 — онбординг ассистента, чтобы он не спрашивал про доверие на каждом свежем томе.
step '3/5 assistant — seed claude-онбординга'
run mkdir -p "$CLAUDE_CONFIG_DIR"
if [ ! -f "$CLAUDE_CONFIG_DIR/.claude.json" ]; then
  printf '%s\n' '{"hasCompletedOnboarding":true,"hasTrustDialogAccepted":true,"theme":"dark"}' \
    >"$CLAUDE_CONFIG_DIR/.claude.json" || stop "$?"
fi

# 4/5 — без доступа к приватному реестру установка уходит в npmjs.org и отвечает «404, пакета
# нет», хотя пакет есть. Разница диагностируется здесь, а не в чужом логе установки.
step '4/5 registry — проверка доступа к реестру'
registry="$(env -u NPM_CONFIG_STORE_DIR pnpm config get @web-core:registry)"

case "$registry" in
http*) ;;
*)
  printf '%s\n' \
    '[devbox] Пакеты @web-core/* тянутся из приватного реестра, а он не настроен.' \
    '[devbox] Установка пойдёт в npmjs.org и ответит «404, пакета нет» — хотя пакет есть, нет доступа.' \
    '[devbox] Настрой доступ в /home/node/.secrets/npmrc — том, переживает пересоздание контейнера:' \
    '[devbox]   npm config set @web-core:registry <адрес-реестра> --location=user' \
    '[devbox]   npm config set //<хост-реестра>/:_authToken <токен> --location=user' >&2
  stop 1
  ;;
esac

if ! env -u NPM_CONFIG_STORE_DIR pnpm whoami --registry="$registry" >/dev/null 2>&1; then
  host="${registry#*://}"
  host="${host%/}"
  printf '%s\n' \
    '[devbox] Реестр для @web-core настроен, а доступа к нему нет: токен не положен или протух.' \
    "[devbox]   реестр: $registry" \
    "[devbox]   проверка руками: pnpm whoami --registry=$registry" \
    '[devbox] Положи токен в /home/node/.secrets/npmrc — том, переживает пересоздание контейнера:' \
    "[devbox]   npm config set //$host/:_authToken <токен> --location=user" >&2
  stop 1
fi

# 5/5 — зависимости строго по лок-файлу.
step '5/5 install — установка зависимостей'
if [ -f package.json ]; then
  run pnpm install --frozen-lockfile --config.confirmModulesPurge=false
else
  printf '%s\n' \
    '[devbox] package.json в корне нет — ставить нечего, установка зависимостей пропущена.' \
    '[devbox] Локация не на ноде — задай свою команду настройкой installCommand, она поедет как написана.' >&2
fi
