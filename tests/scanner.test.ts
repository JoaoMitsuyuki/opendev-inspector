import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';
import { scanProject } from '../src/core/scanner.js';
import { MODULE_NAMES } from '../src/core/types.js';
import { renderJson } from '../src/reporters/json.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('scanProject', () => {
  it('detects a secret and never includes its full value in the report', async () => {
    const root = await createProject();
    const secret = ['ghp', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('_');
    await writeFile(
      path.join(root, 'config.ts'),
      `export const token = '${secret}';\n`,
    );

    const result = await scanProject({
      root,
      modules: ['secrets'],
      maxFileSizeBytes: 1_000_000,
    });
    const report = renderJson(result);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe('secrets/github-token');
    expect(result.findings[0]?.location.line).toBe(1);
    expect(report).not.toContain(secret);
    expect(result.findings[0]?.evidence).toContain('…');
  });

  it('runs all MVP modules and reports unsafe project health signals', async () => {
    const root = await createProject();
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ dependencies: { risky: '*' } }),
    );
    await writeFile(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { strict: false } }),
    );
    await writeFile(path.join(root, '.env'), 'SAFE_EXAMPLE=value\n');
    await mkdir(path.join(root, 'src'));
    await writeFile(
      path.join(root, 'src', 'index.ts'),
      'export const answer = 42;\n',
    );

    const result = await scanProject({
      root,
      modules: [...MODULE_NAMES],
      maxFileSizeBytes: 1_000_000,
    });
    const rules = result.findings.map((finding) => finding.ruleId);

    expect(rules).toContain('config/sensitive-env-file');
    expect(rules).toContain('config/typescript-strict-disabled');
    expect(rules).toContain('dependencies/missing-lockfile');
    expect(rules).toContain('dependencies/unbounded-version');
    expect(rules).toContain('quality/no-tests');
    expect(rules).toContain('quality/missing-readme');
  });

  it('ignores dependencies and symbolic links during discovery', async () => {
    const root = await createProject();
    await mkdir(path.join(root, 'node_modules'));
    const ignoredCredential = ['password', 'unsafevalue'].join('=');
    await writeFile(
      path.join(root, 'node_modules', 'ignored.ts'),
      ignoredCredential,
    );
    await writeFile(path.join(root, 'README.md'), '# Safe project\n');

    const result = await scanProject({
      root,
      modules: ['secrets'],
      maxFileSizeBytes: 1_000_000,
    });

    expect(result.summary.filesScanned).toBe(1);
    expect(result.findings).toHaveLength(0);
  });

  it('skips files above the configured size limit', async () => {
    const root = await createProject();
    const oversizedCredential = ['password', 'a'.repeat(100)].join('=');
    await writeFile(path.join(root, 'large.txt'), oversizedCredential);

    const result = await scanProject({
      root,
      modules: ['secrets'],
      maxFileSizeBytes: 10,
    });

    expect(result.findings).toHaveLength(0);
  });

  it('ignores common placeholder credentials', async () => {
    const root = await createProject();
    await writeFile(
      path.join(root, 'example.env'),
      ['API_KEY=your_api_key_here', 'PASSWORD=${PASSWORD}'].join('\n'),
    );

    const result = await scanProject({
      root,
      modules: ['secrets'],
      maxFileSizeBytes: 1_000_000,
    });

    expect(result.findings).toHaveLength(0);
  });
});

async function createProject(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'opendev-test-'));
  temporaryDirectories.push(root);
  return root;
}
