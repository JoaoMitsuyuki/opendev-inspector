import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { ScanResult } from '../src/core/types.js';

const cli = fileURLToPath(new URL('../src/cli/index.ts', import.meta.url));
const tsx = fileURLToPath(
  new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url),
);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('CLI', () => {
  it('emits a machine-readable JSON report', async () => {
    const root = await createProject();
    await writeFile(path.join(root, 'README.md'), '# Example\n');

    const execution = runCli(['scan', root, '--format', 'json']);
    const report = JSON.parse(execution.stdout) as ScanResult;

    expect(execution.status).toBe(0);
    expect(report.schemaVersion).toBe('1.0');
    expect(report.summary.findings).toBe(0);
    expect(report.modules).toEqual([
      'secrets',
      'config',
      'dependencies',
      'quality',
    ]);
  });

  it('enforces a severity threshold without exposing the secret', async () => {
    const root = await createProject();
    const secret = ['ghp', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('_');
    await writeFile(
      path.join(root, 'config.ts'),
      `export const token = '${secret}';\n`,
    );

    const execution = runCli([
      'scan',
      root,
      '--format',
      'json',
      '--fail-on',
      'high',
    ]);

    expect(execution.status).toBe(1);
    expect(execution.stdout).not.toContain(secret);
    expect(execution.stdout).toContain('secrets/github-token');
  });

  it('rejects unknown modules', async () => {
    const execution = runCli(['scan', '.', '--modules', 'unknown']);

    expect(execution.status).not.toBe(0);
    expect(execution.stderr).toContain('Unknown module');
  });
});

function runCli(arguments_: string[]) {
  return spawnSync(process.execPath, [tsx, cli, ...arguments_], {
    encoding: 'utf8',
    cwd: fileURLToPath(new URL('..', import.meta.url)),
  });
}

async function createProject(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'opendev-cli-test-'));
  temporaryDirectories.push(root);
  return root;
}
