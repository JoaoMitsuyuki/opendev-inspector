import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isSafeRegularFile } from '../core/files.js';

const TEXT_EXTENSIONS = new Set([
  '',
  '.cjs',
  '.conf',
  '.css',
  '.env',
  '.graphql',
  '.html',
  '.ini',
  '.java',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.php',
  '.properties',
  '.py',
  '.rb',
  '.rs',
  '.sh',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

export function looksLikeTextFile(file: string): boolean {
  const basename = path.basename(file);
  if (basename === 'Dockerfile' || basename.startsWith('.env')) return true;
  return TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
}

export async function readSafeText(
  file: string,
  maxFileSizeBytes: number,
): Promise<string | undefined> {
  if (!looksLikeTextFile(file)) return undefined;
  if (!(await isSafeRegularFile(file, maxFileSizeBytes))) return undefined;
  const content = await readFile(file, 'utf8');
  return content.includes('\0') ? undefined : content;
}

export function relativePath(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join('/');
}

export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '*'.repeat(trimmed.length);
  if (trimmed.length <= 10)
    return `${trimmed.slice(0, 1)}***${trimmed.slice(-1)}`;
  return `${trimmed.slice(0, 3)}…${trimmed.slice(-3)}`;
}
