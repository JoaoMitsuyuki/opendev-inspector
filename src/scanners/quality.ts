import path from 'node:path';
import type { Finding, Scanner } from '../core/types.js';
import { relativePath } from '../utils/text.js';

const TEST_PATTERN =
  /(?:^|\/)(?:tests?|__tests__)(?:\/|$)|\.(?:test|spec)\.[^.]+$/i;

export const qualityScanner: Scanner = {
  name: 'quality',
  async scan(context) {
    const findings: Finding[] = [];
    const relativeFiles = context.files.map((file) =>
      relativePath(context.root, file),
    );
    const hasSource = relativeFiles.some((file) =>
      /\.(?:[cm]?[jt]sx?|py|rb|rs|java|go)$/.test(file),
    );
    const hasTests = relativeFiles.some((file) => TEST_PATTERN.test(file));

    if (hasSource && !hasTests) {
      findings.push({
        ruleId: 'quality/no-tests',
        module: 'quality',
        severity: 'low',
        title: 'No automated tests detected',
        description:
          'Source files were found, but no common test path or filename was detected.',
        recommendation:
          'Add focused automated tests for security-sensitive and business-critical behavior.',
        location: { path: '.' },
      });
    }

    const readme = context.files.find(
      (file) => path.basename(file).toLowerCase() === 'readme.md',
    );
    if (!readme) {
      findings.push({
        ruleId: 'quality/missing-readme',
        module: 'quality',
        severity: 'info',
        title: 'README is missing',
        description: 'No README.md was detected in the scanned project.',
        recommendation:
          'Document the project purpose, setup, usage, and security notes.',
        location: { path: '.' },
      });
    }

    return findings;
  },
};
