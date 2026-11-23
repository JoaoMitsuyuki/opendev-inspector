import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  '.next',
  '.nuxt',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'vendor',
]);

export interface DiscoveryResult {
  files: string[];
  errors: string[];
}

export async function discoverFiles(root: string): Promise<DiscoveryResult> {
  const files: string[] = [];
  const errors: string[] = [];
  const pending = [root];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

    try {
      const entries = await readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        const absolute = path.join(current, entry.name);
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) {
          if (!IGNORED_DIRECTORIES.has(entry.name)) pending.push(absolute);
          continue;
        }
        if (entry.isFile()) files.push(absolute);
      }
    } catch (error) {
      errors.push(
        `${path.relative(root, current) || '.'}: ${toMessage(error)}`,
      );
    }
  }

  return { files: files.sort(), errors };
}

export async function isSafeRegularFile(
  file: string,
  maxFileSizeBytes: number,
): Promise<boolean> {
  try {
    const stats = await lstat(file);
    return (
      stats.isFile() &&
      !stats.isSymbolicLink() &&
      stats.size <= maxFileSizeBytes
    );
  } catch {
    return false;
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
