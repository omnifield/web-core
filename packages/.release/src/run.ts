import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export interface Ran {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

export async function run(command: string, args: readonly string[], cwd: string): Promise<Ran> {
  try {
    const { stdout, stderr } = await exec(command, [...args], { cwd, maxBuffer: 32 * 1024 * 1024 });
    return { ok: true, stdout, stderr };
  } catch (error) {
    const shaped = error as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, stdout: shaped.stdout ?? "", stderr: shaped.stderr ?? shaped.message ?? "" };
  }
}
