#!/usr/bin/env node
// docs-gate.mjs — hard-gate на РАБОТУ до чтения доков. Пока сессия не прочитала тройку корня
// и тройку зоны, в которую лезет, ей доступны только чтение и поиск: ни правки, ни Bash, ни
// MCP, ни субагентов.
//
// Зачем машиной, а не текстом: доки зоны — единственное правило канона, за которым не стояло
// гейта, и оно не исполнялось. `CLAUDE.md` зоны по устройству Claude Code приезжает в контекст
// ТОЛЬКО когда агент уже открыл файл в этой папке (docs: "included when Claude reads files in
// those subdirectories") — то есть напоминание «прочитай README» доезжает после того, как
// работа началась. Родственники: governance (граница правки), git-gate (граница коммита).
//
// Два события в одном файле — учёт и проверка неразделимы:
//   PostToolUse(Read)  — записывает, какие строки какого дока сессия реально прочитала.
//   PreToolUse(*)      — не хватает прочитанного → deny с перечнем непрочитанного.
//
// Прочитанным считается ПОЛНОЕ покрытие файла: Read отдаёт окно (offset/limit, по умолчанию
// 2000 строк), и «открыл первые сто строк ROADMAP» — не прочитал.
//
// Контракт (Claude Code):
//   stdin  = JSON { hook_event_name, tool_name, tool_input, session_id, cwd }
//   stdout = JSON { hookSpecificOutput: { ... } }
//   exit 0 всегда; FAIL-OPEN на внутренней ошибке (баг гейта не должен ломать сессию).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { argv } from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig, roleOf, zonePaths } from "./harness-config.mjs";

// Тулы, которыми доки и читают: гейт их не трогает, иначе сессия не сможет из него выйти.
// Сюда же то, что вообще ничего не меняет: поиск, вопрос человеку, план, загрузка инструкций.
const READ_ONLY_TOOLS = new Set([
  "Read",
  "NotebookRead",
  "Grep",
  "Glob",
  "LS",
  "TodoWrite",
  "ToolSearch",
  "AskUserQuestion",
  "Skill",
  "SlashCommand",
  "EnterPlanMode",
  "ExitPlanMode",
  "ListAgents",
]);

// Доки, которые описывают САМУ папку. Содержимое папки (выписки канона, страницы продукта)
// сюда не входит: `canons/ui-skin/sources` — это 50 выписок при одной доке о папке.
// CLAUDE.md не в списке: его харнесс кладёт в контекст сам.
const DOC_NAMES = ["README.md", "INDEX.md", "FAQ.md", "ROADMAP.yaml", "EXAMPLES.md"];

const READ_WINDOW = 2000; // дефолт Read: строк за один вызов без limit

/** Путь-цель из tool_input, если тул вообще адресует файл. */
export function targetPath(input) {
  const ti = input?.tool_input ?? {};
  return ti.file_path ?? ti.notebook_path ?? null;
}

/** Строк в файле (последняя строка без \n тоже считается). 0 — файла нет/не читается. */
export function lineCount(abs) {
  try {
    const text = readFileSync(abs, "utf8");
    if (text === "") return 0;
    const n = text.split("\n").length;
    return text.endsWith("\n") ? n - 1 : n;
  } catch {
    return 0;
  }
}

/** Окно, которое реально отдал Read по его tool_input. */
export function readWindow(toolInput, total) {
  const offset = Number(toolInput?.offset) > 0 ? Math.floor(Number(toolInput.offset)) : 1;
  const limitRaw = Number(toolInput?.limit);
  const limit = limitRaw > 0 ? Math.floor(limitRaw) : READ_WINDOW;
  const end = Math.min(total, offset + limit - 1);
  return end < offset ? null : [offset, end];
}

/** Слияние отрезков в нормальный вид: отсортированы, непересекающиеся, соседние склеены. */
export function mergeRanges(ranges) {
  const sorted = [...ranges].filter(Boolean).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [from, to] of sorted) {
    const last = out[out.length - 1];
    if (last && from <= last[1] + 1) last[1] = Math.max(last[1], to);
    else out.push([from, to]);
  }
  return out;
}

/** Непрочитанные куски [1, total] — пусто, если файл покрыт целиком. */
export function gaps(ranges, total) {
  if (total <= 0) return [];
  const merged = mergeRanges(ranges);
  const out = [];
  let cursor = 1;
  for (const [from, to] of merged) {
    if (from > cursor) out.push([cursor, from - 1]);
    cursor = Math.max(cursor, to + 1);
    if (cursor > total) break;
  }
  if (cursor <= total) out.push([cursor, total]);
  return out;
}

function statePath(repoRoot, sessionId) {
  const safe = String(sessionId).replace(/[^\w.-]/g, "_");
  return join(repoRoot, ".claude", ".docs-read", `${safe}.json`);
}

export function loadState(repoRoot, sessionId) {
  try {
    return JSON.parse(readFileSync(statePath(repoRoot, sessionId), "utf8"));
  } catch {
    return {};
  }
}

function saveState(repoRoot, sessionId, state) {
  const file = statePath(repoRoot, sessionId);
  try {
    mkdirSync(join(repoRoot, ".claude", ".docs-read"), { recursive: true });
    writeFileSync(file, JSON.stringify(state), "utf8");
  } catch {
    /* fail-open: не записали — гейт просто попросит прочитать ещё раз */
  }
}

/** Доки, описывающие саму папку (те из DOC_NAMES, что в ней лежат). */
function docsOfDir(repoRoot, relDir) {
  const out = [];
  for (const name of DOC_NAMES) {
    const p = relDir ? `${relDir}/${name}` : name;
    if (existsSync(resolve(repoRoot, p))) out.push(p);
  }
  return out;
}

/**
 * Доки ВСЕХ папок на пути к цели — от корня репозитория до папки самого файла. Не «дока зоны»:
 * если у папки есть дока, значит в ней есть что документировать, и мимо этой доки в неё не лезут.
 * Так требование само накрывает и корень, и зону, и вложенный скоуп (`web-core/ui/src/button/`
 * держит свою тройку и своё ТЗ).
 */
export function docsAlongPath(repoRoot, rawTarget) {
  const rel = relative(repoRoot, resolve(repoRoot, rawTarget));
  if (!rel || rel.startsWith("..")) return [];
  const out = [];
  let cur = "";
  for (const part of rel.split(/[\\/]/).slice(0, -1)) {
    cur = cur ? `${cur}/${part}` : part;
    out.push(...docsOfDir(repoRoot, cur));
  }
  return out;
}

/** Доки корней своей зоны (owner читает их независимо от того, куда целится прямо сейчас). */
function docsOfZone(zone, config, repoRoot) {
  const out = [];
  for (const p of zonePaths(config?.zones?.[zone])) {
    out.push(...docsOfDir(repoRoot, p.replace(/\/+$/, "")));
  }
  return out;
}

/**
 * Что сессия обязана прочитать: доки корня репозитория всегда + своя зона (owner) + доки всех
 * папок на пути к файлу, в который целится текущий вызов.
 */
export function requiredDocs({ repoRoot, scope, config, rawTarget }) {
  const req = docsOfDir(repoRoot, "");
  if (scope && roleOf(scope) === "owner" && config?.zones?.[scope]) {
    req.push(...docsOfZone(scope, config, repoRoot));
  }
  if (rawTarget) req.push(...docsAlongPath(repoRoot, rawTarget));
  return [...new Set(req)];
}

/** Непрочитанное из обязательного: [{ rel, total, gaps }]. */
export function unread({ repoRoot, docs, state }) {
  const out = [];
  for (const rel of docs) {
    const total = lineCount(resolve(repoRoot, rel));
    if (total <= 0) continue;
    const holes = gaps(state?.[rel] ?? [], total);
    if (holes.length) out.push({ rel, total, gaps: holes });
  }
  return out;
}

function say(payload) {
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

function allow() {
  say({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" } });
}

function deny(missing) {
  const list = missing.map(({ rel, total, gaps: holes }) => {
    const covered = holes.length === 1 && holes[0][0] === 1 && holes[0][1] === total;
    const what = covered
      ? "не открыт вовсе"
      : `осталось ${holes.map(([f, t]) => `${f}–${t}`).join(", ")}`;
    return `  - \`${rel}\` (${total} строк) — ${what}`;
  });
  const first = missing[0];
  const firstGap = first.gaps[0];
  const msg = [
    `❌ Доки не прочитаны — до них работа заблокирована (docs-gate).`,
    ``,
    `Не прочитано целиком:`,
    ...list,
    ``,
    `README — что это и как устроено · FAQ — почему так, а не иначе · ROADMAP.yaml — ТЗ:`,
    `что сделано и что открыто. Решения, принятые мимо них, противоречат уже принятым.`,
    ``,
    `Действие: прочитай их тулом Read целиком (частичное окно не считается). Начни с`,
    `\`Read ${first.rel}\`${firstGap[0] > 1 ? ` offset=${firstGap[0]}` : ""}.`,
    ``,
    `Не обходи (cat/head через Bash не считается — Bash сейчас и так закрыт).`,
  ].join("\n");
  say({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: msg,
    },
  });
}

function record(input, repoRoot) {
  const rawPath = targetPath(input);
  const sessionId = input?.session_id;
  if (!rawPath || !sessionId) say({});
  const rel = relative(repoRoot, resolve(repoRoot, rawPath));
  if (!rel || rel.startsWith("..")) say({});

  const total = lineCount(resolve(repoRoot, rel));
  if (total <= 0) say({});
  const win = readWindow(input?.tool_input, total);
  if (!win) say({});

  const state = loadState(repoRoot, sessionId);
  state[rel] = mergeRanges([...(state[rel] ?? []), win]);
  saveState(repoRoot, sessionId, state);
  say({});
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  } catch {
    return allow();
  }
  const repoRoot = input.cwd || process.cwd();

  if (input.hook_event_name === "PostToolUse") {
    if (input.tool_name !== "Read" && input.tool_name !== "NotebookRead") say({});
    return record(input, repoRoot);
  }

  if (READ_ONLY_TOOLS.has(input.tool_name)) return allow();

  const scope = process.env.WEBCORE_SCOPE;
  const config = loadConfig(repoRoot);
  const docs = requiredDocs({ repoRoot, scope, config, rawTarget: targetPath(input) });
  const state = loadState(repoRoot, input.session_id);
  const missing = unread({ repoRoot, docs, state });
  if (!missing.length) return allow();
  deny(missing);
}

// main() ТОЛЬКО как скрипт (читает stdin(0)) — при import (тесты) не запускается.
if (fileURLToPath(import.meta.url) === argv[1]) {
  try {
    main();
  } catch {
    allow(); // FAIL-OPEN
  }
}
