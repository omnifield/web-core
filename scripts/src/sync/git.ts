import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export interface Ran {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

export function git(cwd: string) {
  return async (...args: readonly string[]): Promise<Ran> => {
    try {
      const { stdout, stderr } = await exec("git", [...args], { cwd, maxBuffer: 64 * 1024 * 1024 });
      return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error) {
      const shaped = error as { stdout?: string; stderr?: string; message?: string };
      return {
        ok: false,
        stdout: (shaped.stdout ?? "").trim(),
        stderr: (shaped.stderr ?? shaped.message ?? "").trim(),
      };
    }
  };
}
