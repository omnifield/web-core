import { defineCommand, done, failed, nothing, runProgram } from "../../src/index";

const greet = defineCommand({
  name: "greet",
  summary: "здоровается",
  args: [{ name: "who", summary: "кого приветствуем", required: true }],
  options: {
    idle: { flags: "--idle", summary: "притвориться, что работы нет" },
    broken: { flags: "--broken", summary: "притвориться, что не вышло" },
  },
  run({ options, args }) {
    if (options.idle) return nothing("работы не нашлось");
    if (options.broken) return failed("не вышло", { remedy: "попробуйте иначе" });
    return done(`привет, ${args[0]}`, { who: args[0] });
  },
});

process.exitCode = await runProgram({
  name: "fixture-tool",
  summary: "тулза для проверки движка настоящим процессом",
  commands: [greet],
});
