import path from 'node:path';
import type { Finding, Scanner } from '../core/types.js';
import { readSafeText, relativePath } from '../utils/text.js';

export const configScanner: Scanner = {
  name: 'config',
  async scan(context) {
    const findings: Finding[] = [];

    for (const file of context.files) {
      const relative = relativePath(context.root, file);
      const basename = path.basename(file);

      if (isSensitiveEnvFile(basename)) {
        findings.push({
          ruleId: 'config/sensitive-env-file',
          module: 'config',
          severity: 'high',
          title: 'Sensitive environment file present',
          description: `${relative} may contain deployment credentials or private configuration.`,
          recommendation:
            'Keep real environment files out of source control and provide a sanitized .env.example instead.',
          location: { path: relative },
        });
      }

      if (basename === 'tsconfig.json') {
        const content = await readSafeText(file, context.maxFileSizeBytes);
        if (content && /["']strict["']\s*:\s*false/.test(content)) {
          findings.push({
            ruleId: 'config/typescript-strict-disabled',
            module: 'config',
            severity: 'medium',
            title: 'TypeScript strict mode is disabled',
            description:
              'Disabling strict type checks can hide unsafe assumptions and runtime defects.',
            recommendation:
              'Enable compilerOptions.strict and address the reported errors.',
            location: { path: relative },
          });
        }
      }

      if (basename === 'Dockerfile') {
        const content = await readSafeText(file, context.maxFileSizeBytes);
        if (content && !/^\s*USER\s+\S+/im.test(content)) {
          findings.push({
            ruleId: 'config/docker-root-user',
            module: 'config',
            severity: 'medium',
            title: 'Docker image has no non-root USER',
            description: 'The container may run as root by default.',
            recommendation:
              'Create an unprivileged user and select it with a USER instruction.',
            location: { path: relative },
          });
        }
      }
    }

    return findings;
  },
};

function isSensitiveEnvFile(basename: string): boolean {
  return (
    basename === '.env' ||
    (basename.startsWith('.env.') && !basename.endsWith('.example'))
  );
}
