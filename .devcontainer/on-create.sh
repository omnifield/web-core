#!/usr/bin/env bash
# Одноразовая (per-volume) цепочка девбокса: редакция участка, пин пакетного менеджера,
# инструменты локации, браузер, фиксация редакций. Зовётся из `onCreateCommand`.
#
# Шаги НАЗВАНЫ: каждый объявляет себя строкой «[devbox] шаг N/M …», а отказ называет шаг, на
# котором встали, и отдаёт его код — иначе создание контейнера падает молча, и поверх пустого
# лога гадают, что именно не доехало.
set -u

HOME_DIR="${HOME:-/home/node}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# 1/5 — редакция базового образа, на которой собран контейнер.
step '1/5 plot — фиксация редакции участка'
run node "$HERE/steps/plot-edition.mjs" \
  'mcr.microsoft.com/devcontainers/typescript-node:24' \
  '/usr/local/etc/vscode-dev-containers/meta.env' \
  "$HOME_DIR/.devbox-plot-edition.json"

# 2/5 — версия pnpm берётся из пина самого репозитория, не из образа.
step '2/5 corepack — пин пакетного менеджера'
run sudo corepack enable

# 3/5 — ассистент живёт В контейнере, не на хосте.
step '3/5 tools — инструменты локации'
run env -u NPM_CONFIG_STORE_DIR npm install -g @anthropic-ai/claude-code@latest

# 4/5 — браузер для живых проверок UI: chrome-devtools-mcp и браузерные ручки
# `apps/studio/.mcp` поддерживают Chrome, у Chromium гарантии нет. apt тянет системные
# библиотеки сам. Повторный запуск ничего не делает.
step '4/5 browser — браузер для живых проверок UI'
if [ "$(dpkg --print-architecture)" = 'amd64' ]; then
  if ! command -v google-chrome-stable >/dev/null 2>&1; then
    {
      curl -fsSL https://dl.google.com/linux/linux_signing_key.pub |
        sudo gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg &&
        printf '%s\n' 'deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main' |
        sudo tee /etc/apt/sources.list.d/google-chrome.list >/dev/null &&
        sudo apt-get update -qq &&
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq google-chrome-stable
    } || stop "$?"
  fi
else
  printf '%s\n' \
    '[devbox] Сборки Google Chrome для Linux есть только под amd64, архитектура этой машины другая.' \
    '[devbox] Браузер не поставлен: chrome-devtools-mcp и браузерные ручки apps/studio/.mcp работать не будут, проверять UI придётся вручную.' >&2
fi

# 5/5 — что из объявленного реально встало.
step '5/5 editions — фиксация редакций инструментов'
run env -u NPM_CONFIG_STORE_DIR node "$HERE/steps/tool-editions.mjs" \
  '{"@anthropic-ai/claude-code":"latest"}' \
  "$HOME_DIR/.devbox-editions.json"
